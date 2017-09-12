package com.trendmicro.theclient.message;

public class Message {
    private String eventName;

    public Message(String eventName) {
        this.eventName = eventName;
    }

    public String getEventName() {
        return eventName;
    }

    public void setEventName(String eventName) {
        this.eventName = eventName;
    }
}
