/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package servlet.kosthold;

import crypto.ValidSession;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Arrays;
import java.util.Map;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import util.database.KostholdDatabase;
import util.http.StandardResponse;

/**
 *
 * @author Tarald
 */
public class Måltider extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        StandardResponse sr = new StandardResponse(response);
        PrintWriter out = sr.getWriter();
        ValidSession vs = new ValidSession(out, request.getSession());
        String type = request.getParameter("type");
        /* stopper request hvis ugylid session */
        if (!vs.validateSession()) {
            return;
        }
        int brukerId = vs.getId();
        try {
            if (type.equals("insertMåltider")) {
                out.print(insertMåltider(brukerId, request.getParameter("navn"), request.getParameterMap()));
            } else if (type.equals("getMåltider")) {
                out.print(KostholdDatabase.normalQuery("SELECT * FROM måltider WHERE brukerId = " + brukerId + ";").getJSON());
            } else if (type.equals("getMåltiderIngredienser")) {
                out.print(getMåltiderIngredienser(Integer.parseInt(request.getParameter("måltidId"))));
            } else if (type.equals("getMåltiderTabell")) {
                // out.print(getMåltiderTabell(brukerId));
            } else if (type.equals("deleteMåltider")) {

            } else if (type.equals("updateMåltider")) {

            }
        } catch (Exception e) {
            e.printStackTrace(out);
        }

    }

    private String getMåltiderTabell(int brukerId) throws Exception {
        String query = "SELECT måltidId,navn, FROM måltider m LEFT JOIN ingredienser i ON i.måltidId = m.måltidId "
                + "LEFT JOIN matvaretabellen t ON t.matvareId = i.matvareId";
        return KostholdDatabase.normalQuery(query).getJSON();
    }

    private String getMåltiderIngredienser(int måltidId) throws Exception {
        String getMåltiderIngredienserQuery = "SELECT m.matvare,i.matvareId,mengde FROM ingredienser i"
                + " LEFT JOIN matvaretabellen m ON i.matvareId = m.matvareId"
                + " WHERE måltidId = ?;";
        return KostholdDatabase.multiQuery(getMåltiderIngredienserQuery, new Object[]{måltidId}).getJSON();
    }

    private int insertMåltider(int brukerId, String navn, Map<String, String[]> map) throws Exception {
        int lastInsertedId = KostholdDatabase.singleUpdateQuery("INSERT INTO måltider(navn,brukerId) VALUES (?," + brukerId + ");", new Object[]{navn}, true);
        String[][] arr = map.values().toArray(new String[0][0]);
        /* arr inneholder [[type][navn][id,id,id....][verdi,verdi,verdi.....]] */
        Object[] vars = new Object[arr[2].length * 2];
        String baseline = "INSERT INTO ingredienser(måltidId, matvareId, mengde) VALUES ";
        String row = "";
        for (int i = 0; i < arr[2].length; i++) {
            vars[2 * i] = Integer.parseInt(arr[2][i]);
            vars[(2 * i) + 1] = Double.parseDouble(arr[3][i]);
            if (i != 0) {
                row += ",";
            }
            row += "(" + lastInsertedId + ",?,?)";
        }
        return KostholdDatabase.singleUpdateQuery(baseline + row, vars, false);
    }
}
