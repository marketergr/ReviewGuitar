# Generate sitemap.xml
$xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
$xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
Get-ChildItem pages/*.html | ForEach-Object {
  $url = 'https://guitarreview.com/' + $_.Name.Replace('.html', '').Replace('pages/', '')
  $xml += '  <url><loc>' + $url + '</loc><lastmod>' + (Get-Date -Format 'yyyy-MM-dd') + '</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n'
}
$xml += '</urlset>\n'
$xml | Out-File -FilePath sitemap.xml -Encoding UTF8
Write-Host "Generated sitemap.xml with $(Get-ChildItem pages/*.html | Measure-Object | Select-Object -ExpandProperty Count) entries"