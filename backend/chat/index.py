import json
import os
import requests

def handler(event: dict, context) -> dict:
    '''API для работы с Claude через Polza AI'''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }

    api_key = os.environ.get('POLZA_AI_API_KEY')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'POLZA_AI_API_KEY не установлен'}),
            'isBase64Encoded': False
        }

    body_raw = event.get('body', '{}')
    try:
        if isinstance(body_raw, str):
            body = json.loads(body_raw) if body_raw.strip() else {}
        else:
            body = body_raw if isinstance(body_raw, dict) else {}
    except (json.JSONDecodeError, AttributeError):
        body = {}
    
    user_message = body.get('message', '') if isinstance(body, dict) else ''
    history = body.get('history', []) if isinstance(body, dict) else []

    if not user_message:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Сообщение не может быть пустым'}),
            'isBase64Encoded': False
        }

    try:
        messages = []
        for msg in history:
            messages.append({
                'role': msg['role'],
                'content': msg['content']
            })
        
        messages.append({
            'role': 'user',
            'content': user_message
        })

        response = requests.post(
            'https://api.polza.ai/api/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'anthropic/claude-opus-4.6',
                'messages': messages,
                'max_tokens': 4096
            },
            timeout=60
        )

        if response.status_code != 200:
            return {
                'statusCode': response.status_code,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': f'Ошибка API Polza: {response.text}'
                }),
                'isBase64Encoded': False
            }

        result = response.json()
        assistant_message = result['choices'][0]['message']['content']

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': assistant_message
            }),
            'isBase64Encoded': False
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': f'Ошибка сервера: {str(e)}'
            }),
            'isBase64Encoded': False
        }