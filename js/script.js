/*
 * This is a quick prototype to demonstrate the automatic generation of comic
 * strips from provenance documents stored at the ProvStore website
 * (https://provenance.ecs.soton.ac.uk/store/). It was part of my
 * master's thesis at the Düsseldorf University of Applied Sciences and the
 * German Aerospace Center (Deutsches Zentrum für Luft- und Raumfahrt, DLR)
 * in Cologne.
 * 
 * Regina Struminski <regina.struminski@study.hs-duesseldorf.de>
 */

$(window).on('load', function () {

	/********** PROVSTORE **********/
	var api = new $.provStoreApi();
	// for authorized access:
	var api = new $.provStoreApi({
		username: "rstruminski",
		key: "4a7ee1435754b528472ba6345499c1b2f860d4a8"
	});

	// make a new Comic:
	var comic = new ProvComic("#comic");
	/********** URL PARAMETERS **********/
	var uri = new URI();
	var urlParams = uri.search(true);
	// check query string: see if document ID or username are already set
	var docId = urlParams['docId'];
	var username = urlParams['username'];
	// if document ID is set, load the document
	if (typeof (docId) !== "undefined" && docId !== "" && docId !== null) {
		loadDoc(docId);
	}

	/********** INIT **********/
	var doc = null;
	// if username is set, write it into text box and fetch user's documents
	if (typeof (username) !== "undefined" && username !== "" && username !== null) {
		$("#input-username").val(username);
		loadUserDocs(username);
	}

	/********** EVENTS **********/
	// clicking user selection button or hitting Enter in username text box:
	$("#button-list").click(selectUser);
	$("#input-username").keyup(function (event) {
		if (event.keyCode === 13) {
			selectUser();
		}
	});
	// clicking document selection button or changing document selection:
	$("#button-select").click(selectDoc);
	$("#select-documents").change(selectDoc);





	/***************************************************************************
	 * USER AND DOCUMENT SELECTION FUNCTIONS / LOADING DOCUMENT FROM PROVSTORE
	 ***************************************************************************/
	function selectUser() {
		username = $("#input-username").val();
		if (username !== "") {
			window.location.href = uri.search("?username=" + username);
		} else {
			alert("Please enter a username.");
		}
	}

	function selectDoc() {
		docId = $("#select-documents").val();
		if (docId !== "") {
			window.location.href = uri.search("?username=" + username + "&docId=" + docId);
		} else {
			alert("Please select a document.");
		}
	}

	function loadUserDocs(username) {
		// show loading screen
		$("#overlay").fadeIn();
		// fetch user's documents
		api.request(
				'documents/?order_by=-created_at&owner=' + username, // user
				null, // data object
				'GET', // method
				function (data) {					// success
					$("#overlay").fadeOut(function () {
						// empty the dropdown menu
						$("#select-documents").empty();
						if (data.objects.length > 0) {
							// if documents are present, fill the dropdown menu
							data.objects.sort(compareByDocName);
							$(data.objects).each(function () {
								$("#select-documents").append('<option value="' + this.id + '">' + this.document_name + '</option>');
							});
							// select the current document, if applicable
							if (typeof (docId) !== "undefined" && docId !== "" && docId !== null) {
								$("#select-documents").val(docId);
							} else {
								$("#select-documents option").first().select();
							}
						} else {
							// else display an error
							alert('No documents found for "' + username + '"');
							return false;
						}
					});
				},
				function (error) {					// error
					$("#overlay").fadeOut(function () {
						alert("[loadUserDocs] Unable to connect to ProvStore.");
					});
				}
		);
	}

	function loadDoc(docId) {
		// show loading screen
		$("#overlay").fadeIn();
		// fetch selected document
		api.getDocumentBody(
				docId, // document ID
				'xml', // one of the supported formats
				//'json', // one of the supported formats
						function (data) {			// success
							doc = $(data).find("prov\\:document");
							$("#overlay").fadeOut(function () {
								// log all agents
								if (doc === null) {
									alert("Document (ID: " + docId + ") not found.");
									return;
								}
								createComic(doc);
							});
						},
						function (error) {				// error
							$("#overlay").fadeOut(function () {
								alert("Unable to load document(s) from ProvStore.");
							});
						}
				);
				$("#document-link").attr("href", "https://provenance.ecs.soton.ac.uk/store/documents/" + docId);
			}

	/**
	 * Comparator for sorting objects alphabetically by their document_name attribute.
	 * @param Object a The first object.
	 * @param Object b The second object.
	 * @returns Number 1 if a>b; -1 if b>a; 0 if equal
	 */
	function compareByDocName(a, b) {
		if (a.document_name > b.document_name) {
			return 1;
		} else if (b.document_name > a.document_name) {
			return -1;
		}
		return 0;
	}





	/***************************************************************************
	 * DISPLAY FUNCTIONS
	 ***************************************************************************/

	function createComic() {
		var activities = getActivities(doc);
		activities.forEach(function (activity) {
			var usedEntities = getEntitiesUsedBy(activity.name);
			activity['usedEntities'] = usedEntities;
			var createdEntities = getEntitiesCreatedBy(activity.name);
			activity['createdEntities'] = createdEntities;
			var softwareAgent = getSoftwareAgent(activity.name);
			activity['softwareAgent'] = softwareAgent;
		});
		displayActivities(activities, comic);
	}

	function displayActivities(activities, element) {

		var activityNames = ["aggregate", "export", "input", "request", "visualize"];

		activities.forEach(function (activity) {

			// check activity name against the array
			for (var i = 0; i < activityNames.length; i++) {
				// if it is found
				if (activity.name.indexOf(activityNames[i]) > -1) {
					switch (activityNames[i]) {
						case "request":
							// if this is a request, display different stories
							// depending on the role (uploading or downloading)
							if (activity.usedEntities[0].role === "downloading") {
								displayDownload(activity, element);
							} else if (activity.createdEntities[0].role === "uploading") {
								displayUpload(activity, element);
							}
							break;

						case "input": displayInput(activity, element); break;
						case "export": displayExport(activity, element); break;
						case "aggregate": displayAggregate(activity, element); break;
						case "visualize": displayVisualize(activity, element); break;
					}
					break;
				}
			}
		});
	}

	function displayInput(activity, element) {
		var firstCreatedEntity = activity.createdEntities[0];
		if (firstCreatedEntity !== null) {
			var owner = getOwnerOfType(firstCreatedEntity, "Person");
			var aPanelGroup = element.addPanelGroup("input");
			aPanelGroup.addInputPanels(activity, firstCreatedEntity, owner);
		}
	}

	function displayDownload(activity, element) {
		var firstUsedEntity = activity.usedEntities[0];
		if (firstUsedEntity !== null) {
			var owner = getOwnerOfType(firstUsedEntity, "Person");
			var hoster = getOwnerOfType(firstUsedEntity, "Organization");
			var aPanelGroup = element.addPanelGroup("download");
			aPanelGroup.addDownloadPanels(activity, firstUsedEntity, owner, hoster);
		}
	}

	function displayUpload(activity, element) {
		var firstCreatedEntity = activity.createdEntities[0];
		if (firstCreatedEntity !== null) {
			var owner = getOwnerOfType(firstCreatedEntity, "Person");
			var hoster = getOwnerOfType(firstCreatedEntity, "Organization");
			var aPanelGroup = element.addPanelGroup("upload");
			aPanelGroup.addUploadPanels(activity, firstCreatedEntity, owner, hoster);
		}
	}

	function displayVisualize(activity, element) {
		var firstCreatedEntity = activity.createdEntities[0];
		var firstUsedEntity = activity.usedEntities[0];
		var owner = getOwnerOfType(firstUsedEntity, "Person");
		if (firstCreatedEntity !== null) {
			var aPanelGroup = element.addPanelGroup("visualize");
			aPanelGroup.addVisualizePanels(activity, firstUsedEntity, firstCreatedEntity, owner);
		}
	}

	function displayExport(activity, element) {
		var firstCreatedEntity = activity.createdEntities[0];
		var firstUsedEntity = activity.usedEntities[0];
		var owner = getOwnerOfType(firstUsedEntity, "Person");
		if (firstCreatedEntity !== null) {
			var aPanelGroup = element.addPanelGroup("export");
			aPanelGroup.addExportPanels(activity, firstUsedEntity, firstCreatedEntity, owner);
		}
	}

	function displayAggregate(activity, element) {
		var firstCreatedEntity = activity.createdEntities[0];
		var owner = getOwnerOfType(firstCreatedEntity, "Person");
		if (firstCreatedEntity !== null) {
			var aPanelGroup = element.addPanelGroup("aggregate");
			aPanelGroup.addAggregatePanels(activity, owner);
		}
	}





	/***************************************************************************
	 * FUNCTIONS THAT READ AGENTS, ACTIVITIES, ETC. FROM THE DOCUMENT
	 ***************************************************************************/

	/********** GET ACTIVITIES INFO **********/
	function getActivities(element) {
		var activities = [];
		// select all entities that are direct children of element AND
		// have the attribute prov:id (because all others are just references,
		// e.g. from wasAssociatedWith)
		element.find("prov\\:activity[prov\\:id]").each(function () {
			var activityName = $(this).attr("prov:id");
			var activityDate = $(this).find("prov\\:startTime").text();
			activities.push({name: activityName, time: activityDate});
		});
		activities.sort(compareByActivityDate);
		return activities;
	}
	
	/**
	 * Comparator for sorting objects by their time attribute.
	 * @param Object a The first object.
	 * @param Object b The second object.
	 * @returns Number 1 if a>b; -1 if b>a; 0 if equal
	 */
	function compareByActivityDate(a, b) {
		if (a.time > b.time) {
			return 1;
		} else if (b.time > a.time) {
			return -1;
		}
		return 0;
	}



	/********** GET AGENTS INFO **********/
	function getSoftwareAgent(activity) {
		var softwareAgent = null;
		var allAgents = getAgentsAssociatedWith(activity);
		allAgents.forEach(function (agent) {
			if (agent.type.indexOf("SoftwareAgent") > -1) {
				softwareAgent = agent;
			}
		});
		return softwareAgent;
	}

	function getAgentsAssociatedWith(activity) {
		var activityAgents = [];
		// select agents that were associated with the activity given as parameter
		doc.find("prov\\:wasAssociatedWith prov\\:activity[prov\\:ref='" + activity + "']")
				.each(function () {
					var agentName = $(this).siblings("prov\\:agent").attr("prov:ref");
					var agentData = getAgentByName(agentName, $(this).parent().parent());
					activityAgents.push(agentData);
				});
		return activityAgents;
	}

	function getAgentByName(agentName, element) {
		var agentData = null;
		// select entities that were generated by the activity given as parameter
		var agent = element.find("prov\\:agent[prov\\:id='" + agentName + "']");
		var label = agent.find("prov\\:label").text();
		var type = agent.find("prov\\:type").text();
		var device = agent.find("qs\\:device").text();
		agentData = {name: label, type: type, device: device};
		return agentData;
	}



	/********** GET ENTITIES INFO **********/
	function getEntitiesCreatedBy(activity) {
		var generatedEntities = [];
		// select entities that were generated by the activity given as parameter
		doc.find("prov\\:wasGeneratedBy prov\\:activity[prov\\:ref='" + activity + "']")
				.each(function () {
					var entityName = $(this).siblings("prov\\:entity").attr("prov:ref");
					var role = $(this).siblings("prov\\:role").text();
					var time = $(this).siblings("prov\\:time").text();
					var owners = getEntityOwners(entityName, $(this).parent().parent());
					var type = getEntityType(entityName, $(this).parent().parent());
					generatedEntities.push({name: entityName, role: role, time: time, owners: owners, type: type});
				});
		return generatedEntities;
	}

	function getEntitiesUsedBy(activity) {
		var usedEntities = [];
		// select entities that were used  by the activity given as parameter
		doc.find("prov\\:used prov\\:activity[prov\\:ref='" + activity + "']")
				.each(function () {
					var entityName = $(this).siblings("prov\\:entity").attr("prov:ref");
					var role = $(this).siblings("prov\\:role").text();
					var owners = getEntityOwners(entityName, $(this).parent().parent());
					var type = getEntityType(entityName, $(this).parent().parent());
					usedEntities.push({name: entityName, role: role, owners: owners, type: type});
				});
		return usedEntities;
	}

	function getEntityOwners(entity, element) {
		var attributedAgents = [];
		// select agents that the entity given as parameter is attributed to
		element.find("prov\\:wasAttributedTo prov\\:entity[prov\\:ref='" + entity + "']")
				.each(function () {
					var agentName = $(this).siblings("prov\\:agent").attr("prov:ref");
					var agentData = getAgentByName(agentName, doc);
					attributedAgents.push(agentData);
				});
		return attributedAgents;
	}

	function getOwnerOfType(entity, ownerType) {
		var owner = null;
		entity.owners.forEach(function (oneOwner) {
			if (oneOwner.type === "prov:" + ownerType) {
				owner = oneOwner;
				return;
			}
		});
		return owner;
	}

	function getEntityType(entity, element) {
		// select agents that the entity given as parameter is attributed to
		var firstEntity = element.find("prov\\:entity[prov\\:id='" + entity + "'] prov\\:type");
		var type = firstEntity.text();
		return type;
	}

});