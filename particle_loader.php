<?php

require_once('calculator.php');

$response = array();
$error = false;

//var_dump($_REQUEST);

if ( isset($_POST['delta']) && isset($_POST['viewSize']) ) {
//if ( isset($_REQUEST['delta']) && isset($_REQUEST['viewSize']) ) {
 
	$response['data'] = getParticleData( $_POST['viewSize'], $_POST['delta']);
        //$response['data'] = getParticleData( $_REQUEST['viewSize'], $_REQUEST['delta']);

} else {
	$error = true;
}

$response['error'] = $error;

echo json_encode($response);