package com.trendmicro.theclient.message;

import com.trendmicro.theclient.message.data.ActionData;

public class ActionMessage extends Message {

    private ActionData data;

    public ActionMessage(String eventName, ActionData data) {
        super(eventName);
        this.data = data;
    }

    public ActionData getData() {
        return data;
    }

    public void setData(ActionData data) {
        this.data = data;
    }
}
