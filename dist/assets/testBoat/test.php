<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');

$apiUrl = 'https://api.yachtbroker.org/listings?key=67a8b59af94cfc737964a2f1d1e09fb9a63fd469&id=85973';
$featuredBrokerageId = 40000660;
$allowedSorts = ['price_asc', 'price_desc', 'length_asc', 'length_desc'];
$selectedSort = $_GET['sort'] ?? 'price_asc';

if (!in_array($selectedSort, $allowedSorts, true)) {
    $selectedSort = 'price_asc';
}

function listingToFloat(mixed $value): float
{
    if (is_numeric($value)) {
        return (float) $value;
    }

    if (is_string($value)) {
        $clean = preg_replace('/[^0-9.\-]/', '', $value) ?? '';
        return is_numeric($clean) ? (float) $clean : 0.0;
    }

    return 0.0;
}

function listingToInt(mixed $value): int
{
    return (int) round(listingToFloat($value));
}

function findCabinValue(array $listing): string
{
    $cabinKeys = [
        'CabinCount',
        'Cabins',
        'TotalCabins',
        'StateroomCount',
        'Heads',
        'Berths',
        'Beds',
    ];

    foreach ($cabinKeys as $key) {
        $val = $listing[$key] ?? null;
        if ($val !== null && $val !== '') {
            return (string) $val;
        }
    }

    return 'N/A';
}

function findPictureUrl(array $listing): string
{
    $directPicture = $listing['DisplayPicture'] ?? null;
    if (is_string($directPicture) && $directPicture !== '') {
        return $directPicture;
    }

    $displayPicture = $listing['DisplayPicture'] ?? [];
    if (is_array($displayPicture)) {
        $medium = $displayPicture['Medium'] ?? $displayPicture['medium'] ?? null;
        if (is_string($medium) && $medium !== '') {
            return $medium;
        }
    }

    $photos = $listing['Pictures'] ?? $listing['Images'] ?? [];
    if (is_array($photos) && !empty($photos)) {
        $first = $photos[0] ?? [];
        if (is_array($first)) {
            $medium = $first['Medium'] ?? $first['medium'] ?? null;
            $large = $first['Large'] ?? $first['large'] ?? null;
            $url = $first['Url'] ?? $first['url'] ?? null;
            foreach ([$medium, $large, $url] as $candidate) {
                if (is_string($candidate) && $candidate !== '') {
                    return $candidate;
                }
            }
        }
    }

    return '';
}

function extractListingsFromPayload(array $payload): array
{
    $commonKeys = ['listings', 'Listings', 'results', 'Results', 'data', 'Data'];

    foreach ($commonKeys as $key) {
        if (!isset($payload[$key])) {
            continue;
        }

        $value = $payload[$key];
        if (is_array($value)) {
            if (array_is_list($value)) {
                return $value;
            }

            $nested = extractListingsFromPayload($value);
            if (!empty($nested)) {
                return $nested;
            }
        }
    }

    foreach ($payload as $value) {
        if (!is_array($value)) {
            continue;
        }

        if (array_is_list($value)) {
            $first = $value[0] ?? null;
            if (is_array($first) && (isset($first['ListingOwnerBrokerageID']) || isset($first['PriceUSD']) || isset($first['VesselName']))) {
                return $value;
            }
        }

        $nested = extractListingsFromPayload($value);
        if (!empty($nested)) {
            return $nested;
        }
    }

    return [];
}

$curlError = '';
$errorMessage = '';
$rawResponse = '';
$decoded = null;
$allListings = [];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 35);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 15);
curl_setopt($ch, CURLOPT_PROXY, '91.200.212.229:12323');
curl_setopt($ch, CURLOPT_PROXYUSERPWD, '14a375b791e00:985ad8a0a0');
curl_setopt($ch, CURLOPT_PROXYTYPE, CURLPROXY_HTTP);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

$rawResponse = curl_exec($ch);

if ($rawResponse === false) {
    $curlError = curl_error($ch);
    $errorMessage = 'API request failed: ' . $curlError;
}

curl_close($ch);

if ($errorMessage === '' && trim((string) $rawResponse) === '') {
    $errorMessage = 'API returned an empty response.';
}

if ($errorMessage === '') {
    $decoded = json_decode((string) $rawResponse, true);
    if (!is_array($decoded)) {
        $errorMessage = 'Invalid JSON received from API.';
    }
}

if ($errorMessage === '') {
    if (array_is_list($decoded)) {
        $allListings = $decoded;
    } else {
        $allListings = extractListingsFromPayload($decoded);
    }

    if (empty($allListings)) {
        $errorMessage = 'JSON structure is valid but listings array was not found.';
    }
}

if (!empty($allListings)) {
    usort($allListings, static function (array $a, array $b) use ($selectedSort): int {
        $priceA = listingToFloat($a['PriceUSD'] ?? $a['Price'] ?? 0);
        $priceB = listingToFloat($b['PriceUSD'] ?? $b['Price'] ?? 0);
        $lengthA = listingToFloat($a['DisplayLengthFeet'] ?? $a['LengthFeet'] ?? $a['LOA'] ?? 0);
        $lengthB = listingToFloat($b['DisplayLengthFeet'] ?? $b['LengthFeet'] ?? $b['LOA'] ?? 0);

        return match ($selectedSort) {
            'price_desc' => $priceB <=> $priceA,
            'length_asc' => $lengthA <=> $lengthB,
            'length_desc' => $lengthB <=> $lengthA,
            default => $priceA <=> $priceB,
        };
    });
}

$myListings = [];
$otherListings = [];

foreach ($allListings as $listing) {
    if (!is_array($listing)) {
        continue;
    }

    $ownerId = listingToInt($listing['ListingOwnerBrokerageID'] ?? 0);
    if ($ownerId === $featuredBrokerageId) {
        $myListings[] = $listing;
    } else {
        $otherListings[] = $listing;
    }
}
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Boat Listings Prototype</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 24px;
            background: #f5f7f9;
            color: #1f2937;
        }
        h1, h2 {
            margin: 0 0 12px;
        }
        .controls {
            margin-bottom: 20px;
            padding: 12px;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
        }
        .alert {
            padding: 12px;
            margin-bottom: 20px;
            border-radius: 8px;
            background: #fee2e2;
            border: 1px solid #ef4444;
            color: #7f1d1d;
        }
        .section {
            margin-bottom: 28px;
        }
        .cards {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 14px;
        }
        .card {
            background: #ffffff;
            border: 1px solid #d1d5db;
            border-radius: 10px;
            overflow: hidden;
        }
        .card.featured {
            border: 2px solid #16a34a;
        }
        .thumb {
            width: 100%;
            height: 170px;
            object-fit: cover;
            background: #e5e7eb;
            display: block;
        }
        .meta {
            padding: 12px;
        }
        .name {
            margin: 0 0 10px;
            font-size: 18px;
            font-weight: 700;
        }
        .row {
            margin: 4px 0;
            font-size: 14px;
        }
        .badge {
            display: inline-block;
            margin-bottom: 8px;
            padding: 2px 8px;
            font-size: 12px;
            border-radius: 999px;
            background: #16a34a;
            color: #ffffff;
            font-weight: 700;
        }
        .muted {
            color: #6b7280;
        }
    </style>
</head>
<body>
    <h1>Inventory Prototype</h1>

    <div class="controls">
        <form method="get">
            <label for="sort"><strong>Sort:</strong></label>
            <select name="sort" id="sort" onchange="this.form.submit()">
                <option value="price_asc" <?php echo $selectedSort === 'price_asc' ? 'selected' : ''; ?>>Price Low - High</option>
                <option value="price_desc" <?php echo $selectedSort === 'price_desc' ? 'selected' : ''; ?>>Price High - Low</option>
                <option value="length_asc" <?php echo $selectedSort === 'length_asc' ? 'selected' : ''; ?>>Length Low - High</option>
                <option value="length_desc" <?php echo $selectedSort === 'length_desc' ? 'selected' : ''; ?>>Length High - Low</option>
            </select>
            <noscript><button type="submit">Apply</button></noscript>
        </form>
    </div>

    <?php if ($errorMessage !== ''): ?>
        <div class="alert"><?php echo htmlspecialchars($errorMessage, ENT_QUOTES, 'UTF-8'); ?></div>
    <?php endif; ?>

    <div class="section">
        <h2>Featured Listings</h2>
        <?php if (empty($myListings)): ?>
            <p class="muted">No featured listings found.</p>
        <?php else: ?>
            <div class="cards">
                <?php foreach ($myListings as $listing): ?>
                    <?php
                        $name = (string) ($listing['VesselName'] ?? 'No Name');
                        $price = listingToFloat($listing['PriceUSD'] ?? $listing['Price'] ?? 0);
                        $length = (string) ($listing['DisplayLengthFeet'] ?? $listing['LengthFeet'] ?? $listing['LOA'] ?? 'N/A');
                        $cabins = findCabinValue($listing);
                        $picture = findPictureUrl($listing);
                    ?>
                    <article class="card featured">
                        <?php if ($picture !== ''): ?>
                            <img class="thumb" src="<?php echo htmlspecialchars($picture, ENT_QUOTES, 'UTF-8'); ?>" alt="Listing photo">
                        <?php else: ?>
                            <div class="thumb"></div>
                        <?php endif; ?>
                        <div class="meta">
                            <span class="badge">FEATURED</span>
                            <h3 class="name"><?php echo htmlspecialchars($name !== '' ? $name : 'No Name', ENT_QUOTES, 'UTF-8'); ?></h3>
                            <p class="row"><strong>Price:</strong> $<?php echo number_format($price, 0); ?></p>
                            <p class="row"><strong>Length:</strong> <?php echo htmlspecialchars($length !== '' ? $length : 'N/A', ENT_QUOTES, 'UTF-8'); ?> ft</p>
                            <p class="row"><strong>Cabins/Beds:</strong> <?php echo htmlspecialchars($cabins, ENT_QUOTES, 'UTF-8'); ?></p>
                        </div>
                    </article>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>

    <div class="section">
        <h2>Other MLS Listings</h2>
        <?php if (empty($otherListings)): ?>
            <p class="muted">No additional MLS listings found.</p>
        <?php else: ?>
            <div class="cards">
                <?php foreach ($otherListings as $listing): ?>
                    <?php
                        $name = (string) ($listing['VesselName'] ?? 'No Name');
                        $price = listingToFloat($listing['PriceUSD'] ?? $listing['Price'] ?? 0);
                        $length = (string) ($listing['DisplayLengthFeet'] ?? $listing['LengthFeet'] ?? $listing['LOA'] ?? 'N/A');
                        $cabins = findCabinValue($listing);
                        $picture = findPictureUrl($listing);
                    ?>
                    <article class="card">
                        <?php if ($picture !== ''): ?>
                            <img class="thumb" src="<?php echo htmlspecialchars($picture, ENT_QUOTES, 'UTF-8'); ?>" alt="Listing photo">
                        <?php else: ?>
                            <div class="thumb"></div>
                        <?php endif; ?>
                        <div class="meta">
                            <h3 class="name"><?php echo htmlspecialchars($name !== '' ? $name : 'No Name', ENT_QUOTES, 'UTF-8'); ?></h3>
                            <p class="row"><strong>Price:</strong> $<?php echo number_format($price, 0); ?></p>
                            <p class="row"><strong>Length:</strong> <?php echo htmlspecialchars($length !== '' ? $length : 'N/A', ENT_QUOTES, 'UTF-8'); ?> ft</p>
                            <p class="row"><strong>Cabins/Beds:</strong> <?php echo htmlspecialchars($cabins, ENT_QUOTES, 'UTF-8'); ?></p>
                        </div>
                    </article>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>