document.body.addEventListener("click",function(){
	removeAutocompleteDiv();
});
document.body.appendChild(getNavigation());

/* ikke i bruk */
function passordGenerator(){
	request("type=passordGen&passord="+encodeURIComponent(""),"Kosthold/Post",function(){
		console.log(this.response+"\n");
	})
}


function getSelectedAutocompleteIndex(children){
	for(let i=0;i<children.length;i++){
		let tempElement = children[i];
		if(tempElement.getAttribute("class")=="selectedAutocompleteDiv"){
			return i;
		}
	}
}

/* alle sidene trenger navigation */


function getNavigation(){
	validSession();
	let mainDiv = getDiv(false,"navigation");

	let arr = [["/","index"],
	["/vekt/","vekt"],
	["/stats/","stats"],
	["/måltider/","måltider"],
	["/matvaretabellen/","matvaretabellen"],
	["/innstillinger/","innstillinger"],
	["/logg/","logg"]];
	let currentUrl = window.location.href;
	let urlArr = currentUrl.split("/");
	let currentSite = decodeURIComponent(urlArr[3]);
	for(let i=0;i<arr.length;i++){
		let anchor = document.createElement("a");
		anchor.setAttribute("href",arr[i][0]);
		if(arr[i][1]==currentSite || (i==0 && currentSite=="")){
			anchor.setAttribute("id","selectedNavigation")
		}
		anchor.innerText = arr[i][1];
		mainDiv.appendChild(anchor);
	}

	let fakeAnchor  = document.createElement("a");
	fakeAnchor.innerText = "logout";
	fakeAnchor.addEventListener("click",function(){
		logout();
	})
	mainDiv.appendChild(fakeAnchor);

	return mainDiv;
}

function validSession(){
	request("type=auth","Kosthold/Post",function(){
		if(this.response != 1){
			window.location = "http://kosthold.tarves.no/login";
		}
	});
}

function logout(){
	request("type=logout","Kosthold/Post",function(){
		window.location = "http://kosthold.tarves.no/login";
	});
}

function request(data,urlAddition,func){
	var oReq = new XMLHttpRequest();
	oReq.addEventListener('load',func);
	oReq.open("POST", "https://tomcat.tarves.no/"+urlAddition);
	oReq.setRequestHeader("Content-type", "application/x-www-form-urlencoded;charset=utf-8");
	oReq.withCredentials = true;
	oReq.send(data);	
}

/*function checkAuth(){
	request("type=auth",function(){
		if(this.response ==1){
			removeChildren(document.body);
			buildHTML();
		} else {
			document.body.appendChild(getLoginForm());
		}
	});
}*/

/*Brukes av 'Lagre matvare knapper og måltid knapper'*/
function matvareCollectionInsert(){
	/*hvis funksjonen er aktivert av en request eller click */
	if(this.response){
		var matvareCollection = document.getElementById("matvareCollection");
		var data = JSON.parse(this.response);
		var length = Object.keys(data).length;
		for(i=0;i<length;i++){
			matvareCollection.appendChild(localFunc(data[i].matvare,data[i].matvareId,data[i].mengde));
		}
	} else {
		var whichCollection = this.getAttribute("collection");
		var matvareCollection = document.getElementById(whichCollection);
		var matvareInput = this.parentNode.firstChild.lastChild.firstChild;
		var gramInput = this.parentNode.firstChild.nextSibling.lastChild;
		matvareCollection.appendChild(localFunc(matvareInput.value,matvareInput.getAttribute("data-id"),gramInput.value));
		matvareInput.value = "";
		gramInput.value = "";
	}

	function localFunc(navn,id,mengde){
		var tempDiv = getDiv("removeFromCollectionDiv");
		tempDiv.addEventListener("click",function(){
			this.remove();
		});

		var tempNavnInput = document.createElement("input");
		tempNavnInput.setAttribute("disabled","");
		tempNavnInput.setAttribute("data-id",id);
		tempNavnInput.value = navn;

		var tempMengdeInput = document.createElement("input");
		tempMengdeInput.setAttribute("disabled","");
		tempMengdeInput.value = mengde;

		tempDiv.appendChild(tempNavnInput);
		tempDiv.appendChild(tempMengdeInput);
		return tempDiv;
	}
}



/* bruker disse to til å knytte autocomplete div til den aktive input */
function autocompleteFocusOut(){
	this.setAttribute("id","");
}
function autocompleteFocusIn(){
	this.setAttribute("id","activatedAutocomplete");
}


/* insert sender tilbake tall når det funka, ellers limes inn error */
function handleInsertResponse(response){
	if(!isNaN(response)){
		window.location.reload();
	} else {
		var bodyNode = document.body;
		removeChildren(bodyNode);
		bodyNode.insertAdjacentHTML('afterbegin',response);
	}
}

/* brukes av både måltidForm og loggForm til å hente data til request*/
function getCollectionDataForForm(collection){
	var output = "";
	var matvareCollection = document.getElementById(collection);
	var divChildren = matvareCollection.children;
	for(i=0;i<divChildren.length;i++){
		var tempInputChildren = divChildren[i].children;
		var tempId = tempInputChildren[0].getAttribute("data-id");
		var tempMengde = tempInputChildren[1].value;
		output += "&matvareId"+i+"="+tempId+"&matvareMengde"+i+"="+tempMengde;
	}
	return output;
}



/* brukes av logg, måltid og matvare forms til autocomplete */
function autocomplete(event){
	let keyPressed = event.key;
	let autocompleteActive = document.getElementById("autocompleteDiv");
	if(autocompleteActive && keyPressed == "ArrowDown"){
		changeSelectedAutocompleteDiv(autocompleteActive.firstChild);
	}else {
		removeAutocompleteDiv();
		var parent = this.parentNode;
		var tabell = this.getAttribute("data-tabell");
		request("type=autocomplete&string="+this.value+"&table="+tabell,"Kosthold/Post",function(){
			var obj = JSON.parse(this.response);
			var whichInputActivatedAutocomplete = document.getElementById("activatedAutocomplete");
			whichInputActivatedAutocomplete.parentNode.appendChild(getAutocompleteDiv(obj));
		});
	}
	
}

/* generere en div med 2 input og forklaringer, hvor hoved input har autocomplete, brukes av logg og måltid */
function getMatvareInputWithAutocompleteDiv(databaseNavn,whichCollection){
	var matvareInput = document.createElement("input");
	matvareInput.setAttribute("type","text");
	matvareInput.setAttribute("data-tabell",databaseNavn);
	matvareInput.addEventListener('keyup',autocomplete);
	matvareInput.addEventListener("focusin",autocompleteFocusIn);
	matvareInput.addEventListener("focusout",autocompleteFocusOut);


	var autocompleteContainer = getDiv("autocompleteContainerDiv")
	autocompleteContainer.appendChild(matvareInput);

	var matvareBeskrivelse = document.createElement("div");
	matvareBeskrivelse.innerText = "matvare";

	var matvareBeskrivelseDiv = getDiv("inlineDiv");
	matvareBeskrivelseDiv.appendChild(matvareBeskrivelse);
	matvareBeskrivelseDiv.appendChild(autocompleteContainer);

	var matvareMengdeInput = document.createElement("input");
	matvareMengdeInput.setAttribute("type","number");
	matvareMengdeInput.addEventListener("focusin",removeAutocompleteDiv);
	matvareMengdeInput.setAttribute("id","matvareMengdeInput");

	var mengdeBeskrivelse = document.createElement("div");
	mengdeBeskrivelse.innerText = "gram";

	var mengdeBeskrivelseDiv = getDiv("inlineDiv");
	mengdeBeskrivelseDiv.appendChild(mengdeBeskrivelse);
	mengdeBeskrivelseDiv.appendChild(matvareMengdeInput);

	var lagreMatvareButtonDiv = getDiv("divButton");
	lagreMatvareButtonDiv.innerHTML = "Lagre matvare";
	lagreMatvareButtonDiv.setAttribute("collection",whichCollection);
	lagreMatvareButtonDiv.addEventListener("click",matvareCollectionInsert)

	var mainDiv = getDiv("inlineDiv");
	mainDiv.appendChild(matvareBeskrivelseDiv);
	mainDiv.appendChild(mengdeBeskrivelseDiv);
	mainDiv.appendChild(lagreMatvareButtonDiv);

	return mainDiv;
}

/* TODO validering av input*/
function inputValidering(inputNode,boolean,errorTekst){
	inputNode.setCustomValidity("");
	inputNode.parentNode.classList.remove("has-error");
	if (!boolean) {
		inputNode.setCustomValidity(errorTekst);
		inputNode.parentNode.classList.add("has-error");
	}
}

/* brukes av autocomplete */
function highlightString(original, stringToMatch){
	var index = original.toLowerCase().indexOf(stringToMatch.toLowerCase());
	if(index>=0){
		var beforeString = original.slice(0,index);
		var slicedString = original.slice(index,index+stringToMatch.length);
		var afterString = original.slice(index+stringToMatch.length);
		return beforeString.concat("<strong>"+slicedString+"</strong>",afterString);
	} else {
		return original;
	}
}

function removeAutocompleteDiv(){
	var elem = document.getElementById("autocompleteDiv");
	while(elem){
		elem.remove();
		var elem = document.getElementById("autocompleteDiv");
	}

}

function getTableFromJSON(json){

	let table = document.createElement("table");
	let headerRow = document.createElement("tr");

	/* keys til første element */
	let keys = Object.keys(json[0]);

	/* begyner på 1, siden 0 er data-id */
	for(let j=1;j<keys.length;j++){
		let tempHeader = document.createElement("th");
		tempHeader.innerText = keys[j];
		headerRow.appendChild(tempHeader);
	}

	table.appendChild(headerRow);

	var length = Object.keys(json).length;

	for(let i=0;i<length;i++){

		table.appendChild(getStatsTableRow(json[i]));
	}

	return table;

}

function getStatsTableRow(obj){
	/* eks: {vektId:"7",kilo:"89.5",dato:"2019-02-16"} */
	let keys = Object.keys(obj);

	let tempRow = document.createElement("tr");

	/* obs: id må alltid være første element i object, id er vanligvis først i databasen */
	tempRow.setAttribute("data-id",obj[keys[0]]);
	tempRow.setAttribute("class","statsTableRow");

	for(let i=1;i<keys.length;i++){
		let tempTD = document.createElement("td");
		tempTD.innerText = obj[keys[i]];
		tempRow.appendChild(tempTD);
	}

	/* extra */
	let deleteTD = document.createElement("td");
	deleteTD.innerText = "slett";
	deleteTD.setAttribute("class","deleteButton statsTableButton");
	deleteTD.addEventListener("click",function(){
		let id = this.parentNode.getAttribute("data-id");
		/* IKKE DYNAMISK */
		request("type=deleteVekt&vektId="+id,"Kosthold/Vekt",function(){
			handleInsertResponse(this.response);
		});
	});

	let updateTD = document.createElement("td");
	updateTD.innerText = "endre";
	updateTD.setAttribute("class","updateButton statsTableButton");
	updateTD.addEventListener("click",function(){
		let parentRow = this.parentNode;
		updateRow(parentRow);
	});

	tempRow.appendChild(updateTD);
	tempRow.appendChild(deleteTD);
	return(tempRow);
}

/* TODO dynamisk */
function updateRow(node){
	let children = node.children;
	let datoValue = children[0].innerText;
	let kiloValue = children[1].innerText;
	removeChildren(node);

	let datoTD = document.createElement("td");
	datoTD.setAttribute("class","statsTableDato");
	let datoInsert = document.createElement("input");
	datoInsert.setAttribute("class","TDInsert");
	datoInsert.setAttribute("type","text");
	datoInsert.setAttribute("placeholder",datoValue);
	datoTD.appendChild(datoInsert);

	let kiloTD = document.createElement("td");	
	kiloTD.setAttribute("class","statsTableKilo");
	let kiloInsert = document.createElement("input");
	kiloInsert.setAttribute("class","TDInsert");
	kiloInsert.setAttribute("type","number");
	kiloInsert.setAttribute("step","0.01");
	kiloInsert.setAttribute("placeholder",kiloValue);
	kiloTD.appendChild(kiloInsert);

	let bekreftTD = document.createElement("td")
	bekreftTD.setAttribute("class","confirmButton statsTableButton");
	bekreftTD.innerText = "bekreft";
	bekreftTD.addEventListener("click",function(){
		let parentRow = this.parentNode;
		let id = parentRow.getAttribute("data-id");
		let kilo = getInputValueOrPlaceholder(parentRow.firstChild.nextSibling.children[0]);
		let dato = getInputValueOrPlaceholder(parentRow.firstChild.children[0]);
		
		request("type=updateVekt&vektId="+id+"&kilo="+kilo+"&dato="+dato,"Kosthold/Vekt",function(){
			handleInsertResponse(this.response);
		});
	});
	let avbrytTD = document.createElement("td")
	avbrytTD.setAttribute("class","cancelButton statsTableButton");
	avbrytTD.innerText = "avbryt";
	avbrytTD.addEventListener("click",function(){
		/* avbryter endring og setter tilbake en ny node lik den som ble fjernet */
		let tempParentRow = this.parentNode;
		let dato = tempParentRow.firstChild.children[0].getAttribute("placeholder");
		let kilo = tempParentRow.firstChild.nextSibling.children[0].getAttribute("placeholder");
		let id = tempParentRow.getAttribute("data-id");
		let obj = {id:id,dato:dato,kilo:kilo}
		let newRow = getStatsTableRow(obj);
		tempParentRow.parentNode.insertBefore(newRow, tempParentRow);
		tempParentRow.parentNode.removeChild(tempParentRow);
	});

	node.appendChild(datoTD);
	node.appendChild(kiloTD);
	node.appendChild(bekreftTD);
	node.appendChild(avbrytTD);
}

function changeSelectedAutocompleteDiv(newNode){
	if(newNode){
		let children = newNode.parentNode.children;
		for(let i=0;i<children.length;i++){
			let tempElement = children[i];
			if(tempElement == newNode){
				tempElement.setAttribute("class","selectedAutocompleteDiv");
				tempElement.focus();
			} else {
				tempElement.setAttribute("class","");
			}
		}
	}
}

/* generere div med tekst fra json til autocomplete */
function getAutocompleteDiv(json){
	var autocompleteDiv = getDiv(false,"autocompleteDiv")

	var searchWord = json.search;
	var length = Object.keys(json).length;

	for(i=0;i<length-1;i++){
		var keys = Object.keys(json[i]);
		var tempDiv = document.createElement("div");
		tempDiv.setAttribute("data-id",json[i][keys[1]]);
		var wholeString = json[i][keys[0]];
		tempDiv.innerHTML = highlightString(wholeString,searchWord)
		tempDiv.setAttribute("tabindex","0");

		tempDiv.addEventListener("focusin",function(){
			changeSelectedAutocompleteDiv(this);
		});

		tempDiv.addEventListener("keyup",function(event){
			let keyPressed = event.key;
			if(keyPressed == "ArrowDown"){
				let nextAutocompleteSibling = this.nextSibling;
				changeSelectedAutocompleteDiv(nextAutocompleteSibling);
			}else if(keyPressed == "ArrowUp"){
				let previousAutocompleteSibling = this.previousSibling;
				if(previousAutocompleteSibling){
					changeSelectedAutocompleteDiv(previousAutocompleteSibling);
				} else {
					this.parentNode.parentNode.firstChild.focus();
					removeAutocompleteDiv();
				}
			}else if(keyPressed == "Enter"){
				let input = this.parentNode.parentNode.firstChild;
				input.value = this.innerText;
				input.setAttribute("data-id",this.getAttribute("data-id"));
				input.focus();
				input.setAttribute("id","");
				removeAutocompleteDiv();
			}
		});


		tempDiv.addEventListener("click",function(){
			var parent = this.parentNode.parentNode;
			var firstChild = parent.firstChild;
			firstChild.value = this.innerText;
			var id = this.getAttribute("data-id");
			if(isNaN(parseInt(id))){
				var mengdeInput = parent.nextSibling;
				mengdeInput.placeholder = id;
			} else {
				firstChild.setAttribute("data-id",id);
			}			
			removeAutocompleteDiv();
		})
		autocompleteDiv.appendChild(tempDiv);
	}
	return autocompleteDiv;
}

function getDiv(className,idName){
	var div = document.createElement("div");
	if(className){
		div.setAttribute("class",className);
	}
	if(idName){
		div.setAttribute("id",idName);
	}
	return div;
}

function removeChildren(myNode){
	while (myNode.firstChild) {
		myNode.removeChild(myNode.firstChild);
	}
}

function getInputValueOrPlaceholder(inputNode){
	var output = "";
	if(inputNode.value){
		output = inputNode.value;
	} else {
		output = inputNode.getAttribute("placeholder");
	}
	return output;
}