package com.trendmicro.thegame;

import com.mongodb.*;
import com.mongodb.client.MongoDatabase;
import org.apache.poi.hssf.usermodel.HSSFCell;
import org.apache.poi.hssf.usermodel.HSSFRow;
import org.apache.poi.hssf.usermodel.HSSFSheet;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.poifs.filesystem.POIFSFileSystem;

import java.io.FileInputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

/**
 * Created by the-engine-team
 * 2017-09-20
 */
public class PlayerImport {

	final static int TEAM_COL = 0;
	final static int GROUP_COL = 1;
	final static int NAME_COL = 2;
	final static int AUTHOR_COL = 3;

    private String poiFile;
	private String dbHost;
    private String dbName;
    private String user;
    private String password;

    private List<Player> playerList;

    private PlayerImport(String poiFile, String dbHost, String dbName, String user, String password) {
        this.poiFile = poiFile;
        this.dbHost = dbHost;
        this.dbName = dbName;
        this.user = user;
        this.password = password;
    }

    private void shufflePlayers() {
        int playerCount = playerList.size();
        int max = playerCount;
        int min = 0;
        for (int i = 0; i < 10000; i++) {
            int index1 = (int)(Math.random() * max);
            int index2 = (int)(Math.random() * max);
            Collections.swap(playerList, index1, index2);
        }
    }

    private void importPlayers() {
        FileInputStream fis = null;
        POIFSFileSystem fs = null;
        try {
            MongoClientURI uri  = new MongoClientURI("mongodb://admin:123456@localhost:27017/the_game");
            MongoClient client = new MongoClient(uri);
            MongoDatabase db = client.getDatabase(uri.getDatabase());

            System.out.println("===== THE game player import tool =====");
            fis = new FileInputStream(poiFile);
            fs = new POIFSFileSystem(fis);
            HSSFWorkbook wb = new HSSFWorkbook(fs);
            HSSFSheet sheet = wb.getSheetAt(0);
            int rowsTotal = sheet.getPhysicalNumberOfRows();
            System.out.println("total teams = " + rowsTotal);
            // TODO: calculate this total table according to actual players
            int totalTable = 9;

            String playerName = "";
            String displayName = "";
            String authorName = "";
            String team = "";
            String lastTeam = "";
            int group = 0;
            int tableNumber = 0;
            playerList = new ArrayList<Player>();
            for (int i = 0; i < rowsTotal; i++) {
                HSSFRow row = sheet.getRow(i);

                if (row != null) {
                    for (int j = 0; j < row.getLastCellNum(); j++) {
                        HSSFCell cell = row.getCell((short) j);
                        Object value = null;
                        if (cell.getCellType() == 0) {
                            value = Math.round(cell.getNumericCellValue());
                        } else {
                            value = cell.getStringCellValue();
                        }
                        switch (j) {
                            case TEAM_COL:
                                if (value.toString().equals("")) {
                                    team = lastTeam;
                                } else {
                                    lastTeam = team = value.toString();
                                }
                                break;
                            case GROUP_COL:
                                group = value.toString().equals("A") ? 0 : 1;
                                break;
                            case NAME_COL:
                                displayName = value.toString();
                                break;
                            case AUTHOR_COL:
                                authorName = value.toString();
                                break;
                            default:
                                System.out.println("col error");
                                break;
                        }
                    }
                }
                Player player =
                        new Player(team, authorName, displayName, "", 0);
                // set random names
                player.setPlayerName(randomString(16).toUpperCase());
                playerList.add(player);
            }
            // add 4 dummies
            for (int d = 0; d < 4; d++) {
                Player dummy =
                        new Player("D" + d, "Dummy", "Dummy" + d,
                                "", 0);
                dummy.setPlayerName(randomString(16).toUpperCase());
                playerList.add(dummy);
            }
            shufflePlayers();
            // create tables
            int playersInTable = 0;
            int targetTableNumber = 1;
            List<Document> seedData = new ArrayList<Document>();

            for (int i = 0; i < playerList.size(); i++) {
                Player player = playerList.get(i);
                player.setTableNumber(targetTableNumber);
                System.out.println("table " + player.getTableNumber() + ": " + player.getPlayerName() +
                        " - " + player.getDisplayName());
                // insert into DB
                BasicDBObject document = new BasicDBObject();
                document.put("playerName", player.getPlayerName());
                document.put("displayName", player.getDisplayName());
                document.put("tableNumber", player.getTableNumber());
                collection.insert(document);

                playersInTable++;
                if(playersInTable == 10) {
                    playersInTable = 0;
                    targetTableNumber++;
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                fs.close();
                fis.close();
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
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

    public static String randomString(int length) {
        Random randGen = null;
        char[] numbersAndLetters = null;
        Object initLock = new Object();
        if (length < 1) {
            return null;
        }
        if (randGen == null) {
            synchronized (initLock) {
                if (randGen == null) {
                    randGen = new Random();
                    numbersAndLetters = ("0123456789abcdefghijklmnopqrstuvwxyz" +
                            "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ").toCharArray();
                }
            }
        }
        char [] randBuffer = new char[length];
        for (int i=0; i<randBuffer.length; i++) {
            randBuffer[i] = numbersAndLetters[randGen.nextInt(71)];
        }
        return new String(randBuffer);
    }
}