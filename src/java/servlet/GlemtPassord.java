/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package servlet;

import html.ErrorHandling;
import html.IndexHtml;
import html.Input;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.SQLException;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import util.exceptions.BashMailException;
import util.exceptions.BashQueueException;
import util.exceptions.TokenSetException;
import util.sql.Database;
import util.http.Headers;
import util.mail.SendMail;
import util.sql.ResultSetContainer;

/**
 *
 * @author Tarald
 */
public class GlemtPassord extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        Headers.GET(resp);
        PrintWriter out = resp.getWriter();
        ErrorHandling errorHandling = new ErrorHandling(req);
        IndexHtml html = new IndexHtml("LoggLogg Glemt Passord");
        Input epost = new Input("Skriv inn epost her", "Epost", "text", "brukernavnInput", "input-login", "epost", "on");
        String properSubmit = "<input id='loginSubmitInput' class='input-login' type='submit' value='send link'>";
        String properForm = "<form id='registrerForm' class='form-login' method='POST' action=''>"
                + epost.toString()
                + properSubmit
                + "</form>";
        html.addBodyContent(properForm);
        html.addBodyContent(errorHandling.toString());
        out.print(html.toString());
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        Headers.POST(response);
        PrintWriter out = response.getWriter();
        try {
            String epost = request.getParameter("epost");
            int brukerId = getBrukerId(epost);
            SendMail sm = new SendMail(4, epost, brukerId,
                    "Få nytt passord på logglogg.no",
                    "Klikk her for å sette et nytt passord",
                    "Hei, du har nylig bedt om et nytt passord.",
                    "https://logglogg.no/epostlink/");
            sm.send();
            response.sendRedirect("/glemtpassord/?msg=1");
        } catch (ClassNotFoundException | SQLException e) {
            e.printStackTrace(out);
        } catch (TokenSetException e) {
            response.sendRedirect("https://logglogg.no/nybruker?error=3");
        } catch (BashQueueException e) {
            response.sendRedirect("https://logglogg.no/nybruker?error=8");
        } catch (BashMailException e) {
            response.sendRedirect("https://logglogg.no/nybruker?error=4");
        }
    }

    private int getBrukerId(String epost) throws SQLException, ClassNotFoundException {
        String query = "SELECT brukerId FROM users WHERE brukernavn = ? AND epostAktivert = 1;";
        Object[] vars = {epost};
        ResultSetContainer rsc = Database.multiQuery(query, vars);
        int id = Integer.parseInt(rsc.getData()[0][0]);
        return id;
    }

}
