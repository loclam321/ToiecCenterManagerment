"""
Script to list all registered routes in Flask app
"""
from app import create_app

app = create_app()

print("\n" + "="*80)
print("REGISTERED ROUTES IN FLASK APP")
print("="*80 + "\n")

routes = []
for rule in app.url_map.iter_rules():
    routes.append({
        'endpoint': rule.endpoint,
        'methods': ', '.join(sorted(rule.methods - {'HEAD', 'OPTIONS'})),
        'path': str(rule)
    })

# Sort by path
routes.sort(key=lambda x: x['path'])

# Filter only test routes
test_routes = [r for r in routes if '/tests' in r['path']]

print(f"Found {len(test_routes)} routes containing '/tests':\n")
for route in test_routes:
    print(f"  {route['methods']:20} {route['path']:50} -> {route['endpoint']}")

print("\n" + "="*80 + "\n")
