package com.shels.api;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.shels.dao.UsersDAO;
import com.shels.manager.GraphsManager;
import com.shels.map.WGS84;
import com.shels.other.ProjPoint;
import com.shels.other.SHAHashing;
import com.shels.rest.UsersController;
import com.shels.rest.ViewsController;
import com.shels.table.Users;
import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.Socket;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLDecoder;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.ResourceBundle;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import net.sf.jasperreports.engine.JRException;
import net.sf.jasperreports.engine.JasperRunManager;
import org.apache.commons.codec.DecoderException;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.apache.http.HttpHeaders;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.ModelAndView;
import org.apache.commons.codec.binary.Base64;
import org.apache.commons.codec.binary.Hex;
import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.apache.commons.lang.StringUtils;

@Controller
@RequestMapping(SystemApi.PATH)
public class SystemApi 
{
    public static final String PATH = "/system";
    private String key = "";
    private String host = "http://localhost:3000/api";
    private String ip = "127.0.0.1";
    private int port = 10001;
    private static final Boolean PROXY_SERVER = false;
    private static final Boolean TEST_SERVER = true;
    
    public SystemApi() {
        getKeys();
    }
    
    @RequestMapping(value = "/?*", method = RequestMethod.GET)
    public ModelAndView system( HttpServletRequest request, HttpServletResponse response) {
        List<String> urls = getUrls( request);
        return new ModelAndView( "system", "rover", urls.get( 2));
    }    
    
    @RequestMapping(value = "/group/users", method = RequestMethod.GET)
    public void getUserGroupUsers( HttpServletRequest request, HttpServletResponse response) {
        response.setContentType("text/txt;charset=UTF-8");
        response.addHeader("Access-Control-Allow-Origin", "*");
        
        if (request.getRemoteUser() != null) {
            Users user = HomeController.itIs();
            String api = user.getApiSystem();
            
            if (api != null && api.length() > 0) {
                get( "/UserGroups/" +api +"/users", "", "", request, response);
            }
        }
    }    

    @RequestMapping(value = "/user/?*/list", method = RequestMethod.GET)
    public void getUserList( HttpServletRequest request, HttpServletResponse response) {
        response.setContentType("text/txt;charset=UTF-8");
        response.addHeader("Access-Control-Allow-Origin", "*");
        
        List<String> urls = getUrls( request);
        if (isValidHost( request)) {
            get( "/Users/byUsersId/" +urls.get( 3) +"/list", "", "", request, response);
        }
    }
    
    @RequestMapping(value = "/group/connections", method = RequestMethod.GET)
    public void getUserGroupConnections( HttpServletRequest request, HttpServletResponse response) {
        response.setContentType("text/txt;charset=UTF-8");
        response.addHeader("Access-Control-Allow-Origin", "*");
        
        if (request.getRemoteUser() != null) {
            Users user = HomeController.itIs();
            String api = user.getApiSystem();
            
            if (api != null && api.length() > 0) {
                get( "/UserGroups/" +api +"/users/withConnections", "", "", request, response);
            }
        }
    }    

    @RequestMapping(value = "/connection/?*/list", method = RequestMethod.GET)
    public void getConnectionList( HttpServletRequest request, HttpServletResponse response) {
        response.setContentType("text/txt;charset=UTF-8");
        response.addHeader("Access-Control-Allow-Origin", "*");
        
        List<String> urls = getUrls( request);
        if (isValidHost( request)) {
            get( "/Connections/byRoversId/" +urls.get( 3) +"/list", "", "", request, response);
        }
    }
    
    @RequestMapping(value = "/user/?*/connections", method = RequestMethod.GET)
    public void getUserConnections( HttpServletRequest request, HttpServletResponse response) {
        response.setContentType("text/txt;charset=UTF-8");
        response.addHeader("Access-Control-Allow-Origin", "*");
        
        List<String> urls = getUrls( request);
        if (isValidGroup( request)) {
            get( "/Connections/byRoverName/" +urls.get( 3), "", "", request, response);
        }
    }
    
    @RequestMapping(value = "/track/?*/list", method = RequestMethod.GET)
    public void getLogsList( HttpServletRequest request, HttpServletResponse response) {
        response.setContentType("text/txt;charset=UTF-8");
        response.addHeader("Access-Control-Allow-Origin", "*");
        
        List<String> urls = getUrls( request);
        if (isValidGroup( request)) {
            get( "/Tracks/list?rover=" +urls.get( 3), "", "", request, response);
        }
    }
    
    @RequestMapping(value = "/track/?*/?*/logs", method = RequestMethod.GET)
    public void getLogsJson( HttpServletRequest request, HttpServletResponse response) {
        response.setContentType("text/txt;charset=UTF-8");
        response.addHeader("Access-Control-Allow-Origin", "*");
        
        List<String> urls = getUrls( request);
        if (isValidGroup( request) && urls.get( 4).length() == 8) {
            get( "/Tracks/logs?rover=" +urls.get( 3) +"&date=" +urls.get( 4), "", "", request, response);
        }
    }
    
    @RequestMapping(value = "/gps/?*/list", method = RequestMethod.GET)
    public void getGpsList( HttpServletRequest request, HttpServletResponse response) {
        response.setContentType("text/txt;charset=UTF-8");
        response.addHeader("Access-Control-Allow-Origin", "*");
        
        List<String> urls = getUrls( request);        
        if (isValidGroup( request)) {
            get( "/Gps/list?rover=" +urls.get( 3), "", "", request, response);
        }
    }
    
    @RequestMapping(value = "/gps/?*/?*/logs", method = RequestMethod.GET)
    public void getGpsJson( HttpServletRequest request, HttpServletResponse response) {
        response.setContentType("text/txt;charset=UTF-8");
        response.addHeader("Access-Control-Allow-Origin", "*");
        
        List<String> urls = getUrls( request);
        if (isValidGroup( request) && urls.get( 4).length() == 8) {
            get( "/Gps/logs?rover=" +urls.get( 3) +"&date=" +urls.get( 4), "", "", request, response);
        }
    }
    
    // ----------------
    
    public List<String> getUrls( HttpServletRequest request) {
        String url = "";
        url = request.getRequestURI().substring( request.getContextPath().length());
        return new ArrayList<String>( Arrays.asList( url.split( "/")));
    }

    public Boolean isValidAccess( HttpServletRequest request) {
        Boolean valid = false;
        
        if (request.getRemoteUser() != null) {
            Users user = HomeController.itIs();
            String api = user.getApiSystem();
            
            if (api != null && api.length() > 0) {
                valid = true;
            }
        }
        
        if (!valid) {
            valid = isValidHost(request);
        }
        
        return valid;
    }

    public Boolean isValidGroup( HttpServletRequest request) {
        Boolean valid = false;
        
        if (request.getRemoteUser() != null) {
            Users user = HomeController.itIs();
            String api = user.getApiSystem();
            
            if (api != null && api.length() > 0) {
                String url = "";
                url = request.getRequestURI().substring( request.getContextPath().length());
                List<String> urls = new ArrayList<String>( Arrays.asList( url.split( "/")));
                if (isValidUser( api, urls.get( 3))) {
                    valid = true;
                }
            }
        }
        
        if (!valid) {
            valid = isValidHost(request);
        }
        
        return valid;
    }
    
    public Boolean isValidUser( String api, String name) {
        Boolean result = false;
        String method = "GET";
        String accept = "application/json";
        String params = "";
        
        HashMap<String, String> head = new HashMap();
        head.put("token", key);        
        
        if (host.length() > 0) { // && key.length() > 0) {
            String data = getText( host +"/UserGroups/" +api +"/users", method, params, head, accept);
            
            if (data.length() > 2) {
                JsonParser parser = new JsonParser();
                JsonArray json = (JsonArray) parser.parse(data);
                    
                for (Object j : json) {
                    JsonObject obj = (JsonObject) j;
                    
                    if (obj.has( "users")) {
                        JsonArray users = (JsonArray) obj.get( "users");
                        
                        for (Object u : users) {
                            JsonObject user = (JsonObject) u;
                            
                            if (user.has( "username") && user.get( "username").getAsString().equalsIgnoreCase( name)) {
                                result = true;
                                break;
                            }
                        }
                    }
                    
                    if (result) break;
                }
            }
        }
        
        return result;
    }
    
    public Boolean isValidHost( HttpServletRequest request) {
        String ip = request.getRemoteAddr();
        String domain = request.getRemoteHost(); //.replaceAll(".*\\.(?=.*\\.)", "");
        /*
        InetAddress addr;
        try {
            addr = InetAddress.getByName(ip);
            domain = addr.getHostName();
        } catch (UnknownHostException ex) {
            Logger.getLogger( this.getClass().getName()).log(Level.SEVERE, null, ex);
        }
        */ 
        String referer = request.getHeader("referer") != null ? request.getHeader("referer") : "";
        if (referer.length() > 0) referer = getHostName( referer);
        
        if (TEST_SERVER) {
            System.out.println("System user validation:");
            System.out.print(" IP : " +ip);  
            System.out.print(" Domain : " +domain);  
            System.out.println(" Reffer : " +referer);  
        }
        
        return true; //(ip.equalsIgnoreCase( "92.60.184.30") || ip.equalsIgnoreCase( "193.107.24.142") || domain.indexOf( "systemnet.com.ua") >= 0 || referer.indexOf( "systemnet.com.ua") >= 0);
    }
    
    private String getHostName(String urlInput) {
        urlInput = urlInput.toLowerCase();
        String hostName=urlInput;
        if(!urlInput.equals("")){
            if(urlInput.startsWith("http") || urlInput.startsWith("https")){
                try{
                    URL netUrl = new URL(urlInput);
                    String host= netUrl.getHost();
                    if(host.startsWith("www")){
                        hostName = host.substring("www".length()+1);
                    }else{
                        hostName=host;
                    }
                }catch (MalformedURLException e){
                    hostName=urlInput;
                }
            }else if(urlInput.startsWith("www")){
                hostName=urlInput.substring("www".length()+1);
            }
            return  hostName;
        }else{
            return  "";
        }
    }      
    
    // Загрузка данных
    
    public void get( String url, String param, String format, HttpServletRequest request, HttpServletResponse response) 
    {
        /*
        if (request.getRemoteUser() != null) {
            Users user = HomeController.itIs();
            
            if (user != null) {
        */ 
                response.setCharacterEncoding("UTF-8");
                //response.setContentType("text/javascript");        
                //getKeys();

                if (host.length() > 0) { // && key.length() > 0) {
                    String method = "GET";
                    String accept = "application/json"; 

                    String sUrl = host +url +param +format;
                    String params = "";

                    HashMap<String, String> data = new HashMap();
                    //data.put("key", key);

                    for (Map.Entry<String, String> entry : data.entrySet()) {
                        params = params +(params.length() > 0 ? "&" : "") +entry.getKey() +"=" +entry.getValue();
                    }

                    Enumeration<String> parameterNames = request.getParameterNames();
                    while (parameterNames.hasMoreElements()) {
                        String paramName = parameterNames.nextElement();
                        String[] paramValues = request.getParameterValues(paramName);
                        String str = "";
                        for (int i = 0; i < paramValues.length; i++) {
                            String paramValue = paramValues[i];

                            if (paramValue.indexOf( "%") > -1)
                            try {
                                paramValue = URLDecoder.decode(paramValue, "UTF-8");
                            } catch (UnsupportedEncodingException ex) {
                                Logger.getLogger( this.getClass().getName()).log(Level.SEVERE, null, ex);
                            }                    

                            str += (str.length() > 0 ? "," : "") +paramValue;
                        }

                        //data.put( paramName, str);
                        params = params +(params.length() > 0 ? "&" : "") +paramName +"=" +str;
                    }           

                    HashMap<String, String> head = new HashMap();
                    head.put("token", key);

                    try {
                        getText( sUrl, method, params, head, accept, response);
                    } catch (Exception ex) {
                        Logger.getLogger( this.getClass().getName()).log(Level.SEVERE, null, ex);
                    }
                }
        //    }
        //}
    }
    
    public void getText(String url, String method, String params, HashMap<String, String> head, String accept, HttpServletResponse response)
    {
        PrintWriter out;
        try {
            out = response.getWriter();

            try {
                out.print( getText(url, method, params, head, accept));
            } finally {            
                out.close();
            }
        } catch (IOException ex) {
            Logger.getLogger( this.getClass().getName()).log(Level.SEVERE, null, ex);
        }       
    }    
    
    public String getText(String url, String method, String params, HashMap<String, String> head, String accept)
    {
        String result = "";
        
        if (key.length() > 0) {
            url = url +(url.indexOf( "?") > 0 ? "&" : "?") +"access_token=" +key;
        }
        
        if (params.length() > 0) {
            params = (url.indexOf( "?") == 0 ? "?" : "&") +params;
        }
        
        try {
            URL u = new URL( url +(params.length() > 0 ? params : ""));
            URLConnection con = u.openConnection();
            HttpURLConnection http = (HttpURLConnection)con;
            http.setRequestMethod( method);
            http.setRequestProperty( HttpHeaders.CONTENT_TYPE, accept);
            
            for (Map.Entry<String, String> entry : head.entrySet()) {
                http.setRequestProperty( entry.getKey(), entry.getValue());
            }
            /*
            params = "'" +params +"'";
            
            http.setDoOutput(true);  
            DataOutputStream wr = new DataOutputStream(http.getOutputStream());  
            wr.writeBytes(params);  
            wr.flush();  
            wr.close();  
            */ 
            int responseCode = http.getResponseCode();  
            
            if (TEST_SERVER) {
                System.out.println("\nSending 'POST' request to URL : " + url);  
                System.out.println("Post Data : " + params);  
                System.out.println("Response Code : " + responseCode);  
            }
  
            if (responseCode == 200) {
                BufferedReader in = new BufferedReader( new InputStreamReader( http.getInputStream()));  
                String output;  
                StringBuffer res = new StringBuffer();  

                while ((output = in.readLine()) != null) {  
                 res.append(output);  
                }  
                in.close();  
                
                result = res.toString();
            }
        } catch (IOException ex) {
            Logger.getLogger( this.getClass().getName()).log(Level.SEVERE, null, ex);
        }
        
        return result;
    }    
    
    public String getParams( HttpServletRequest request) 
    {
        String str = "", params = "";
        Enumeration<String> parameterNames = request.getParameterNames();
        
        while (parameterNames.hasMoreElements()) {
            String paramName = parameterNames.nextElement();
            String s = paramName +"=" +request.getParameter(paramName);
            
            if (!paramName.equalsIgnoreCase( "start") && !paramName.equalsIgnoreCase( "count")) {
                params = (params.length() > 0 ? params +"&" : "?") +s;
            } else {
                str = str +";" +s.toLowerCase();
            }
        }
        
        return str +params;
    }    

    public String getParam( String params, String name, HttpServletRequest request) 
    {
        if (request.getParameter( name) != null) {
            String paramValue = request.getParameter( name);
            
            if (paramValue.indexOf( "%") > -1)
            try {
                paramValue = URLDecoder.decode(paramValue, "UTF-8");
            } catch (UnsupportedEncodingException ex) {
                Logger.getLogger( this.getClass().getName()).log(Level.SEVERE, null, ex);
            }                    
            
            params = params +(params.length() > 0 ? "&" : "") +name +"=" +paramValue;
        }                        
        
        return params;
    }
    
    public String getPageParams( HttpServletRequest request) 
    {
        String params = "";

        if (request.getParameter( "pagesize") != null) {
            params = params +(params.length() > 0 ? "&" : "?") +"pagesize=" +Integer.parseInt( request.getParameter( "pagesize"));
        }                        

        if (request.getParameter( "page") != null) {
            params = params +(params.length() > 0 ? "&" : "?") +"page=" +Integer.parseInt( request.getParameter( "page"));
        }                 

        return params;
    }
    
    public String getName( HttpServletRequest request) 
    {
        String url = "";
        url = request.getRequestURI().substring( request.getContextPath().length());
        List<String> urls = new ArrayList<String>( Arrays.asList( url.split( "/")));
        return urls.get( 2);
    }

    public void getKeys() 
    {
        ResourceBundle prop = ResourceBundle.getBundle( "gis");

        try{
            this.host = prop.getString( "system.url");
            this.key  = prop.getString( "system.key");
            
            if (prop.getString( "system.ip") != null && prop.getString( "system.port") != null && prop.getString( "system.port").length() > 0) {
                this.ip   = prop.getString( "system.ip");
                this.port = Integer.parseInt( prop.getString( "system.port"));
            }            
        } catch(Exception ex) {
            Logger.getLogger( this.getClass().getName()).log(Level.SEVERE, null, ex);
        }         
    }    
 }