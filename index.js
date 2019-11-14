/* Frontend index.js */
$(document ).ready(function() {
    console.log( "ready!" );
	
	//define the api url and the state values that is needed to perform data manipulation
	let workorderURL =  "https://www.hatchways.io/api/assessment/work_orders";
	let orders = [];
	let sortByEarliest = true;
	
	//query the hatchway api for all the work orders
	jQuery.get({
	  url: workorderURL,
	  dataType: 'json',
	  
	}).done(function (data){
		orders = data.orders;
		
		//query hatchways api asynchronous for individual worker ids
		let promises = [];
		
		for (let i = 0; i < data.orders.length; i++){
			promises.push(new Promise(function(resolve, reject) {
				
				jQuery.get({
				  url: fetchWorkerURL(data.orders[i].workerId),
				  dataType: 'json',
				  
				}).done(function (workerData){
					data.orders[i].worker = workerData.worker;
					resolve();
					
				}).fail(function (jqXHR, textStatus, errorThrown){
					console.log(`${textStatus}: ${errorThrown}`);
					reject();
					
				});
			}));
		}
		
		//handle async when all promises are returned
		Promise.all(promises).then(function(results) {
			data.orders
				.sort((a,b) => {return (sortByEarliest) ? a.deadline - b.deadline:b.deadline - a.deadline;})
				.map((order) => createWorkOrder(order));
				
		}).catch((err) => {
			console.log("Error Querying Hatchways for worker information:", err);
			
		});
		
	}).fail(function (jqXHR, textStatus, errorThrown){
		console.log("Error Querying Hatchways for work order information:");
		console.log(`${textStatus}: ${errorThrown}`);
		
	});
	
	//adding event handler to filter work order by worker id
	document.getElementById("name-input").addEventListener('input', (event)=>{
		$("#workOrderList").empty();
		
		if (event.target.value === "")
			orders
				.sort((a,b) => {return (sortByEarliest) ? a.deadline - b.deadline:b.deadline - a.deadline;})
				.map((order) => createWorkOrder(order));
		else
			orders
			.filter(order => order.workerId == event.target.value)
			.sort((a,b) => {return (sortByEarliest) ? a.deadline - b.deadline:b.deadline - a.deadline;})
			.map((order) => createWorkOrder(order));
			
	});
	
	//adding event handler to change the sorting of the work orders
	$('#deadline-input').change(function(event){
		
		$("#workOrderList").empty();
		sortByEarliest = event.target.checked;
		
		orders
			.sort((a,b) => {return (event.target.checked) ? a.deadline - b.deadline:b.deadline - a.deadline;})
			.map((order) => createWorkOrder(order));
	});
	
});

//returns the correct api URL to access worker information from the hatchway api
function fetchWorkerURL(id){
	return `https://www.hatchways.io/api/assessment/workers/${id}`;
}

//return the correct string output format for the date object
function returnModDate(currDate,addSec){
	
	currDate.setSeconds(currDate.getSeconds() + addSec/1000);
	
	return `${currDate.getMonth()+1}/${currDate.getDate()}/${currDate.getFullYear()}, ${currDate.getHours() % 12 + 1}:${currDate.getSeconds()}:${Math.floor(currDate.getMilliseconds()/10)} ${currDate.getHours() / 12 ? "PM":"AM"}`;
}

//this function performs the proper DOM manipulation to display a new work order 
function createWorkOrder(order){
	
	let todayDate = new Date();
	let orderCol = document.createElement("div");
	
	let orderInfoRow = document.createElement("div");
	let orderInfoCol = document.createElement("div");
	let orderId = document.createElement("h3");
	let orderName = document.createElement("p");
	let orderDesc = document.createElement("p");
	let orderDeadline = document.createElement("p");
	
	orderCol.className = "float-left border col-lg-4 col-md-6 bg-light"
	orderInfoRow.className = "row";
	orderInfoCol.className = "col-md";
	orderDeadline.className = "float-right";
	
	orderId.appendChild(document.createTextNode(`Work Order ${order.id}`));
	orderName.appendChild(document.createTextNode(`Name: ${order.name}`));
	orderDesc.appendChild(document.createTextNode(`Description: ${order.description}`));
	orderDeadline.appendChild(document.createTextNode(`Due ${returnModDate(todayDate,order.deadline)}`));
	orderInfoCol.appendChild(orderId);
	orderInfoCol.appendChild(orderName);
	orderInfoCol.appendChild(orderDesc);
	orderInfoRow.appendChild(orderInfoCol);
	orderCol.appendChild(orderInfoRow);
	orderCol.appendChild(createWorker(order.worker));
	orderCol.appendChild(orderDeadline);
	
	document.getElementById("workOrderList").appendChild(orderCol);
}

//this function performs the proper DOM manipulation to display worker information
function createWorker(worker){
	let workerRow = document.createElement("div");
	let workerIconCol = document.createElement("div");
	let workerIcon = document.createElement("img");
	
	let workerInfoCol = document.createElement("div");
	let workerName = document.createElement("h5");
	let workerCompany = document.createElement("p");
	let workerEmail = document.createElement("p");
	
	workerRow.className = "row";
	workerIconCol.className = "float-left h-100 col-md-4";
	workerIcon.className = "w-100 rounded-circle";
	workerIcon.src = worker.image;
	
	workerInfoCol.className = "float-left workerInfo col-md-8";
	workerName.className = "mb-0";
	workerCompany.className = "mb-0";
	
	workerName.appendChild(document.createTextNode(`${worker.name}`));
	workerCompany.appendChild(document.createTextNode(`${worker.companyName}`));
	workerEmail.appendChild(document.createTextNode(`${worker.email}`));
	workerInfoCol.appendChild(workerName);
	workerInfoCol.appendChild(workerCompany);
	workerInfoCol.appendChild(workerEmail);
	
	workerIconCol.appendChild(workerIcon);
	workerRow.appendChild(workerIconCol);
	workerRow.appendChild(workerInfoCol);
	
	return workerRow;
}