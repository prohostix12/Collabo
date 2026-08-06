import urllib.request, json

req = urllib.request.Request('http://localhost:8000/api/ecommerce/reviews/?product=5')
resp = urllib.request.urlopen(req)
data = json.loads(resp.read().decode())
print('Reviews for Matcha Powder:', data['count'])
for r in data['results']:
    print("  Rating:", r['rating'], "| Comment:", r['comment'], "| Code:", r['referral_code'])
