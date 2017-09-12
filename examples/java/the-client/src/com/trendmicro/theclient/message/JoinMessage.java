package com.trendmicro.theclient.message;

import com.trendmicro.theclient.message.data.JoinData;

public class JoinMessage extends Message {

    private JoinData data;

    public JoinMessage(String eventName, JoinData joinData) {
        super(eventName);
        this.data = joinData;
    }

    public JoinData getData() {
        return data;
    }

    public void setData(JoinData data) {
        this.data = data;
    }
}
