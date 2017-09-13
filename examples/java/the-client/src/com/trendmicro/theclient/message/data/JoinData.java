package com.trendmicro.theclient.message.data;

public class JoinData {
    private String playerName;

    public JoinData(String playerName) {
        this.playerName = playerName;
    }

    public String getPlayerName() {
        return playerName;
    }

    public void setPlayerName(String playerName) {
        this.playerName = playerName;
    }
}
