function openStarWindow(id){
	
	var url = '/site/star/id/'+id;
	
	$.post(url,{}, function(data){
		
		if(data.success==true){
			var html = $("#StarWindowTpl").render(data);
			$('body').prepend(html);
		}else{
			console.log('Error. Load star #'+id+' failed.');
		}
		
	},'json');
}

function getCube(x,y,z, callback){

	var url = '/site/cube/x/'+x+'/y/'+y+'/z/'+z;
	var result;
	
	$.post(url,{}, function(data){
		
		if(data.success==true){
			callback(data);
		}else{
			console.log('Error. Load cube ('+x+'x'+y+'x'+z+') failed.');
		}
		
	},'json');
}