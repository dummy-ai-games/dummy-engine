package com.trendmicro.thegame;

import com.mongodb.DB;
import com.mongodb.MongoClient;
import org.apache.poi.hssf.usermodel.HSSFCell;
import org.apache.poi.hssf.usermodel.HSSFRow;
import org.apache.poi.hssf.usermodel.HSSFSheet;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.poifs.filesystem.POIFSFileSystem;

import java.io.FileInputStream;

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

    private PlayerImport(String poiFile, String dbHost, String dbName, String user, String password) {
        this.poiFile = poiFile;
        this.dbHost = dbHost;
        this.dbName = dbName;
        this.user = user;
        this.password = password;
    }

    private void importPlayers() {
        FileInputStream fis = null;
        POIFSFileSystem fs = null;
        try {
            System.out.println("===== THE game player import tool =====");
            fis = new FileInputStream(poiFile);
            fs = new POIFSFileSystem(fis);
            HSSFWorkbook wb = new HSSFWorkbook(fs);
            HSSFSheet sheet = wb.getSheetAt(0);
            int rowsTotal = sheet.getPhysicalNumberOfRows();
            System.out.println("total teams = " + rowsTotal);

            String playerName = "";
            String displayName = "";
            String authorName = "";
            String team = "";
            String lastTeam = "";
            int group = 0;
            int tableNumber = 0;

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
                System.out.println("team: " + team + ", group = " + group +
                        ", displayName = " + displayName + ", author = " + authorName);
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
}