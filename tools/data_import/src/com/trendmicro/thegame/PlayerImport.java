package com.trendmicro.thegame;

import com.mongodb.DB;
import com.mongodb.MongoClient;

/**
 * Created by the-engine-team
 * 2017-09-20
 */
public class PlayerImport {
    private String poiFile;
	private String dbHost;
    private String dbName;
    private String user;
    private String password;

    private PlayerImport(String poiFile, String dbHost, String dbName, String user, String password) {
        this.poiFile = poiFile;
        this.dbHost = dbHost;
        this.dbName = dbName;
        this.user = user;
        this.password = password;
    }

    private void importPlayers() {
        // TODO: add excel to mongoDB import
    }

	public static void main(String[] args) {
		if(args.length != 5) {
			System.out.println("execute this bin using parameters:");
			System.out.println("PlayerImport [poiFile] [mongodbHost] [mongodbName] [mongodbUser] [mongodbPassword]");
			return;
		}
		try {
            String poiFile = args[0];
			String dbHost = args[1];
			String dbName = args[2];
			String user = args[3];
			String password = args[4];

			PlayerImport playerImport = new PlayerImport(poiFile, dbHost, dbName, user, password);
			playerImport.importPlayers();
		} catch(Exception e) {
			e.printStackTrace();
		}
	}
}