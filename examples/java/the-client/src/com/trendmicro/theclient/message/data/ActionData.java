package com.trendmicro.theclient.message.data;

public class ActionData {

    // action could be one of the commands below:
    // "bet", "call", "raise", "fold", "check", "allin"
    // you need to fill amount field when action is "bet",
    // otherwise, leave amount empty
    private String action;
    private String playerName;

    // amount is needed when action is "__bet",
    private int amount;

    public ActionData(String action, String playerName, int amount) {
        this.action = action;
        this.playerName = playerName;
        this.amount = amount;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getPlayerName() {
        return playerName;
    }

    public void setPlayerName(String playerName) {
        this.playerName = playerName;
    }

    public int getAmount() {
        return amount;
    }

    public void setAmount(int amount) {
        this.amount = amount;
    }
}
