<?php

	/*
	Copyright 2015 Christian Fröhlingsdorf, 5cf.de

	Licensed under the Apache License, Version 2.0 (the "License");
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at

		http://www.apache.org/licenses/LICENSE-2.0

	Unless required by applicable law or agreed to in writing, software
	distributed under the License is distributed on an "AS IS" BASIS,
	WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	See the License for the specific language governing permissions and
	limitations under the License.
	*/

	/* Simple CURL Script that makes a HTTP GET/POST Request to the Proxy Server,
	who then uses his open socket connection to the real service (websocket server)
	to transfer the request and return the result from the service to this script.
	The response is then exposed as an application internal resource, that can be easily
	queried by Ajax functions.
	- Christian Fröhlingsdorf, 14.04.2015 EWT ICT Bachelor
	*/
	
	if(!isset($_POST["proxy"])){
		err("You have not set an action, POST parameter 'proxy' missing!");
	}
	
	if(!isset($_POST["delivery"]))
		$_POST["delivery"] = ""; //set to empty string

	//callback (anon func PHP 5.0)
	$cb = function($res) {
		pri($res);
	};
	do_curl_post_request("http://localhost:3536", $_POST["proxy"], $_POST["delivery"], $cb);


	//main curl function
	function do_curl_get_request($url, $proxy, $delivery, $callback){
		$curl = curl_init();
		
		if(!is_string($proxy))
			$proxy = json_encode($proxy);
			
		if(!is_string($delivery))
			$delivery = json_encode($delivery);
		
		//build the query string
		$url .= "?proxy=" . urlencode($proxy) . "&delivery=" . urlencode($delivery);

		curl_setopt_array($curl, array(
			CURLOPT_URL => $url,
			CURLOPT_RETURNTRANSFER => 1
		));

		$response = curl_exec($curl);
		
		if(!$response){ //curl error
			$ce = curl_error($curl);
			curl_close($curl);
			err($ce);
		}
		
		curl_close($curl);

		$callback($response);
	}
	
	function do_curl_post_request($url, $proxy, $delivery, $callback){
		$curl = curl_init();
		
		if(!is_string($proxy))
			$proxy = json_encode($proxy);
			
		if(!is_string($delivery))
			$delivery = json_encode($delivery);
			
		$postfields = "proxy=" . $proxy . "&delivery=" . $delivery;
		
		curl_setopt_array($curl, array(
			CURLOPT_URL => $url,
			CURLOPT_RETURNTRANSFER => 1,
			CURLOPT_POSTFIELDS => $postfields,
			CURLOPT_POST => 1
		));

		$response = curl_exec($curl);
		
		if(!$response){ //curl error
			$ce = curl_error($curl);
			curl_close($curl);
			err($ce);
		}
		
		curl_close($curl);

		$callback($response);
	}
	
	//output error
	function err($msg) {
		header("Access-Control-Allow-Origin: *");
		header('Content-Type: application/json');
		$r = array(
			"result" => false,
			"content" => $msg
		);
		
		echo json_encode($r);
		exit;
	}
	
	//output response
	function pri($res) {
		header("Access-Control-Allow-Origin: *");
		header('Content-Type: application/json');
		$r = array(
			"result" => true,
			"content" => $res
		);
		
		echo json_encode($r);
		exit;
	}

?>