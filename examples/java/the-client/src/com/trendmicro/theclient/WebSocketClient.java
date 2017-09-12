package com.trendmicro.theclient;

import java.io.IOException;

import javax.websocket.ClientEndpoint;
import javax.websocket.OnClose;
import javax.websocket.OnError;
import javax.websocket.OnMessage;
import javax.websocket.OnOpen;
import javax.websocket.Session;

import com.google.gson.Gson;
import com.trendmicro.theclient.message.JoinMessage;
import com.trendmicro.theclient.message.data.JoinData;
import com.trendmicro.theclient.param.SampleConfigurator;
import com.trendmicro.theclient.param.SampleDecoder;
import com.trendmicro.theclient.param.SimpleEncoder;

@ClientEndpoint(
		configurator = SampleConfigurator.class,
		decoders={SampleDecoder.class},
		encoders={SimpleEncoder.class},
		subprotocols={})

public class WebSocketClient {

	private Session session;

	@OnOpen
	public void onOpen(Session session) {
		System.out.println("Client WebSocket is opening...");
		this.session = session;

		// send join message
		JoinData joinData = new JoinData("test2");
		JoinMessage joinMessage = new JoinMessage("__join", joinData);
		String joinString = new Gson().toJson(joinMessage);
		send(joinString);
	}
	
	@OnMessage
	public void onMessage(String message){
		System.out.println("received message: " + message);
	}
	
	@OnClose
	public void onClose(){
		System.out.println("Web socket closed");
	}
	

    @OnError
    public void onError(Session session, Throwable t) {
        t.printStackTrace();
    }


	public void send(Object message){
		this.session.getAsyncRemote().sendObject(message);
	}
	
	public void close() throws IOException{
		if(this.session.isOpen()){
			this.session.close();
		}
	}
}
