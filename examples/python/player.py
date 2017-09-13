#! /usr/bin/env python
# -*- coding:utf-8 -*-


import time
import json
from websocket import create_connection
# pip install websocket-client

def takeAction(action, data):
    if action == "__bet":
        time.sleep(2)
        ws.send(json.dumps({
            "eventName": "__action",
            "data": {
                "action": "bet",
                "playerName": "test3",
                "amount": 100
            }
        }))
    elif action == "__action":
        time.sleep(2)
        ws.send(json.dumps({
            "eventName": "__action",
            "data": {
                "action": "call",
                "playerName": "yang2"
            }
        }))

if __name__ == '__main__':
    ws = create_connection("ws://127.0.0.1:3000/")
    try:
        ws.send(json.dumps({
            "eventName": "__join",
            "data": {
                "playerName": "test3"
            }
        }))
        while 1:
            result = ws.recv()
            msg = json.loads(result)
            event_name = msg["eventName"]
            data = msg["data"]
            print event_name
            print data
            takeAction(event_name, data)
    except Exception, e:
        ws = create_connection("ws://127.0.0.1:3000/")
        print e.message
