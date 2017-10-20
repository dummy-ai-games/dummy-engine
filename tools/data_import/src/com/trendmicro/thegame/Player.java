package com.trendmicro.thegame;

public class Player {
    private int team;
    private String author;
    private String displayName;
    private String playerName;
    private int tableNumber;

    public Player(int team, String author, String displayName, String playerName, int tableNumber) {
        this.team = team;
        this.author = author;
        this.displayName = displayName;
        this.playerName = playerName;
        this.tableNumber = tableNumber;
    }

    public Player() {
        // empty constructor
    }

    public int getTeam() {
        return team;
    }

    public void setTeam(int team) {
        this.team = team;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getPlayerName() {
        return playerName;
    }

    public void setPlayerName(String playerName) {
        this.playerName = playerName;
    }

    public int getTableNumber() {
        return tableNumber;
    }

    public void setTableNumber(int tableNumber) {
        this.tableNumber = tableNumber;
    }
}
