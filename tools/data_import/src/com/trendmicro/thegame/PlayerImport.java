package com.trendmicro.thegame;

import com.mongodb.*;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.apache.poi.hssf.usermodel.HSSFCell;
import org.apache.poi.hssf.usermodel.HSSFRow;
import org.apache.poi.hssf.usermodel.HSSFSheet;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.poifs.filesystem.POIFSFileSystem;
import org.apache.poi.ss.usermodel.CellType;
import org.bson.Document;

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

	private final static int TEAM_COL = 0;
    private final static int GROUP_COL = 1;
    private final static int NAME_COL = 2;
    private final static int AUTHOR_COL = 3;

    private String poiFile;

    private List<Player> playerList;

    private PlayerImport(String poiFile) {
        this.poiFile = poiFile;
    }

    private void shufflePlayers() {
        int max = playerList.size();
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
            String displayName = "";
            String authorName = "";
            String team = "";
            String lastTeam = "";
            int group = 0;
            playerList = new ArrayList<>();
            for (int i = 0; i < rowsTotal; i++) {
                HSSFRow row = sheet.getRow(i);

                if (row != null) {
                    for (int j = 0; j < row.getLastCellNum(); j++) {
                        HSSFCell cell = row.getCell((short) j);
                        Object value;
                        if (cell.getCellTypeEnum() == CellType.NUMERIC) {
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
                        new Player(team, group, authorName, displayName, "", 0);
                // set random names
                player.setPlayerName(randomString(16).toUpperCase());
                playerList.add(player);
            }
            // add 4 dummies
            for (int d = 0; d < 4; d++) {
                Player dummy =
                        new Player("D" + d, 0, "Dummy", "Dummy" + d,
                                "", 0);
                dummy.setPlayerName(randomString(16).toUpperCase());
                playerList.add(dummy);
            }
            shufflePlayers();
            // create tables
            int playersInTable = 0;
            int targetTableNumber = 1;
            int targetPort = 3001;
            List<Document> playerDocument = new ArrayList<>();
            List<Document> tableDocument = new ArrayList<>();

            for (int i = 0; i < playerList.size(); i++) {
                Player player = playerList.get(i);
                player.setTableNumber(targetTableNumber);
                System.out.println("table " + player.getTableNumber() + ": " + player.getPlayerName() +
                        " - " + player.getDisplayName());

                // insert into player collection
                playerDocument.add(new Document("playerName", player.getPlayerName())
                        .append("displayName", player.getDisplayName())
                        .append("tableNumber", player.getTableNumber() + "")
                );

                playersInTable++;
                if(playersInTable == 10) {
                    playersInTable = 0;
                    // insert into table collection
                    tableDocument.add(new Document("tableNumber", targetTableNumber));
                    targetTableNumber++;
                    targetPort++;
                }
            }
            MongoCollection<Document> collection = db.getCollection("tables");
            collection.insertMany(tableDocument);

            collection = db.getCollection("players");
            collection.insertMany(playerDocument);

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                if (null != fs) {
                    fs.close();
                }
                if (null != fis) {
                    fis.close();
                }
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
    }

	public static void main(String[] args) {
		if(args.length != 1) {
			System.out.println("execute this bin using parameters:");
			System.out.println("PlayerImport [poiFile]");
			return;
		}
		try {
            String poiFile = args[0];

			PlayerImport playerImport = new PlayerImport(poiFile);
			playerImport.importPlayers();
		} catch(Exception e) {
			e.printStackTrace();
		}
	}

    private final static Object initLock = new Object();

    private static String randomString(int length) {
        Random randGen;
        char[] numbersAndLetters;
        if (length < 1) {
            return null;
        }
        synchronized (initLock) {
            randGen = new Random();
            numbersAndLetters = ("0123456789abcdefghijklmnopqrstuvwxyz" +
                    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ").toCharArray();
        }
        char [] randBuffer = new char[length];
        for (int i = 0; i < randBuffer.length; i++) {
            randBuffer[i] = numbersAndLetters[randGen.nextInt(71)];
        }
        return new String(randBuffer);
    }
}
