import json

def lambda_handler(event, context):
    print("Received event: " + json.dumps(event, indent=2))
    return 1