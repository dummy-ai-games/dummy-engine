#! /usr/bin/env python
# -*- coding:utf-8 -*-


import time
import json
from websocket import create_connection

# pip install websocket-client
ws = ""

def takeAction(action, data):
    global ws
    if action == "__bet":
        time.sleep(2)
        ws.send(json.dumps({
            "eventName": "__action",
            "data": {
                "action": "bet",
                "playerName": "yang2",
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


def doListen():
    try:
        global ws
        ws = create_connection("ws://127.0.0.1:3000/")
        ws.send(json.dumps({
            "eventName": "__join",
            "data": {
                "playerName": "yang2"
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
        print e.message
        doListen()


if __name__ == '__main__':
    doListen()
