/*
 * This is a quick prototype to demonstrate the automatic generation of comic
 * strips from provenance documents stored at the ProvStore website
 * (https://provenance.ecs.soton.ac.uk/store/). It was part of my
 * master's thesis at the Düsseldorf University of Applied Sciences and the
 * German Aerospace Center (Deutsches Zentrum für Luft- und Raumfahrt, DLR)
 * in Cologne.
 * 
 * Regina Struminski <regina.struminski@study.hs-duesseldorf.de>, DLR-SC <opensource@dlr.de>
 */

$(window).on('load', function () {

  /********** CHORME/FIREFOX XML BUG **********/
	const usePrefix = navigator.userAgent.indexOf("Firefox") > -1;
	const querySelectorPrefix =  usePrefix ? "prov\\:": "";

	/********** PROVSTORE **********/
	const api = new $.provStoreApi();

	// make a new Comic:
	const comic = new ProvComic("#comic");
	/********** URL PARAMETERS **********/
	const uri = new URI();
	const urlParams = uri.search(true);
	// check query string: see if document ID or username are already set
	let docId = urlParams['docId'];
	let username = urlParams['username'];
	// if document ID is set, load the document
	if (typeof (docId) !== "undefined" && docId !== "" && docId !== null) {
		loadDoc(docId);
	}

	/********** INIT **********/
	let doc = null;
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
							window.test = data;
							doc = $(data).find(querySelectorPrefix + "document");
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
	 * @param {Object} a The first object.
	 * @param {Object} b The second object.
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
		const activities = getActivities(doc);
		activities.forEach(function (activity) {
      activity['usedEntities'] = getEntitiesUsedBy(activity.name);
      activity['createdEntities'] = getEntitiesCreatedBy(activity.name);
      activity['softwareAgent'] = getSoftwareAgent(activity.name);
		});
		displayActivities(activities, comic);
	}

	function displayActivities(activities, element) {

		const activityNames = ["aggregate", "export", "input", "request", "visualize"];

		activities.forEach(function (activity) {

			// check activity name against the array
			for (let i = 0; i < activityNames.length; i++) {
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
		let firstCreatedEntity = activity.createdEntities[0];
		if (firstCreatedEntity !== null) {
      let owner = getOwnerOfType(firstCreatedEntity, "Person");
      let aPanelGroup = element.addPanelGroup("input");
			aPanelGroup.addInputPanels(activity, firstCreatedEntity, owner);
		}
	}

	function displayDownload(activity, element) {
		let firstUsedEntity = activity.usedEntities[0];
		if (firstUsedEntity !== null) {
      let owner = getOwnerOfType(firstUsedEntity, "Person");
      let hoster = getOwnerOfType(firstUsedEntity, "Organization");
      let aPanelGroup = element.addPanelGroup("download");
			aPanelGroup.addDownloadPanels(activity, firstUsedEntity, owner, hoster);
		}
	}

	function displayUpload(activity, element) {
    let firstCreatedEntity = activity.createdEntities[0];
		if (firstCreatedEntity !== null) {
      let owner = getOwnerOfType(firstCreatedEntity, "Person");
      let hoster = getOwnerOfType(firstCreatedEntity, "Organization");
      let aPanelGroup = element.addPanelGroup("upload");
			aPanelGroup.addUploadPanels(activity, firstCreatedEntity, owner, hoster);
		}
	}

	function displayVisualize(activity, element) {
    let firstCreatedEntity = activity.createdEntities[0];
    let firstUsedEntity = activity.usedEntities[0];
    let owner = getOwnerOfType(firstUsedEntity, "Person");
		if (firstCreatedEntity !== null) {
      let aPanelGroup = element.addPanelGroup("visualize");
			aPanelGroup.addVisualizePanels(activity, firstUsedEntity, firstCreatedEntity, owner);
		}
	}

	function displayExport(activity, element) {
    let firstCreatedEntity = activity.createdEntities[0];
    let firstUsedEntity = activity.usedEntities[0];
    let owner = getOwnerOfType(firstUsedEntity, "Person");
		if (firstCreatedEntity !== null) {
      let aPanelGroup = element.addPanelGroup("export");
			aPanelGroup.addExportPanels(activity, firstUsedEntity, firstCreatedEntity, owner);
		}
	}

	function displayAggregate(activity, element) {
    let firstCreatedEntity = activity.createdEntities[0];
    let owner = getOwnerOfType(firstCreatedEntity, "Person");
		if (firstCreatedEntity !== null) {
      let aPanelGroup = element.addPanelGroup("aggregate");
			aPanelGroup.addAggregatePanels(activity, owner);
		}
	}





	/***************************************************************************
	 * FUNCTIONS THAT READ AGENTS, ACTIVITIES, ETC. FROM THE DOCUMENT
	 ***************************************************************************/

	/********** GET ACTIVITIES INFO **********/
	function getActivities(element) {
		const activities = [];
		// select all entities that are direct children of element AND
		// have the attribute prov:id (because all others are just references,
		// e.g. from wasAssociatedWith)
		element.find(querySelectorPrefix + "activity[prov\\:id]").each(function () {
      let activityName = $(this).attr("prov:id");
      let activityDate = $(this).find(querySelectorPrefix + "startTime").text();
			activities.push({name: activityName, time: activityDate});
		});
		activities.sort(compareByActivityDate);
		return activities;
	}
	
	/**
	 * Comparator for sorting objects by their time attribute.
	 * @param {Object} a The first object.
	 * @param {Object} b The second object.
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
    let softwareAgent = null;
    let allAgents = getAgentsAssociatedWith(activity);
		allAgents.forEach(function (agent) {
			if (agent.type.indexOf("SoftwareAgent") > -1) {
				softwareAgent = agent;
			}
		});
		return softwareAgent;
	}

	function getAgentsAssociatedWith(activity) {
		const activityAgents = [];
		// select agents that were associated with the activity given as parameter
		doc.find(querySelectorPrefix + "wasAssociatedWith ").find(querySelectorPrefix + "activity[prov\\:ref='" + activity + "']")
				.each(function () {
          let agentName = $(this).siblings("prov\\:agent").attr("prov:ref");
          let agentData = getAgentByName(agentName, $(this).parent().parent());
					activityAgents.push(agentData);
				});
		return activityAgents;
	}

	function getAgentByName(agentName, element) {
    let agentData = null;
		// select entities that were generated by the activity given as parameter
    let agent = element.find(querySelectorPrefix + "agent[prov\\:id='" + agentName + "']");
    let label = agent.find(querySelectorPrefix + "label").text();
    let type = agent.find(querySelectorPrefix + "type").text();
    let device = agent.find(usePrefix ? "qs\\: " : ""  + "device").text();
		agentData = {name: label, type: type, device: device};
		return agentData;
	}



	/********** GET ENTITIES INFO **********/
	function getEntitiesCreatedBy(activity) {
		const generatedEntities = [];
		// select entities that were generated by the activity given as parameter
		doc.find(querySelectorPrefix + "wasGeneratedBy ").find(querySelectorPrefix + "activity[prov\\:ref='" + activity + "']")
				.each(function () {
          let entityName = $(this).siblings("prov\\:entity").attr("prov:ref");
          let role = $(this).siblings("prov\\:role").text();
          let time = $(this).siblings("prov\\:time").text();
          let owners = getEntityOwners(entityName, $(this).parent().parent());
          let type = getEntityType(entityName, $(this).parent().parent());
					generatedEntities.push({name: entityName, role: role, time: time, owners: owners, type: type});
				});
		return generatedEntities;
	}

	function getEntitiesUsedBy(activity) {
		const usedEntities = [];
		// select entities that were used  by the activity given as parameter
		doc.find(querySelectorPrefix + "used ").find(querySelectorPrefix + "activity[prov\\:ref='" + activity + "']")
				.each(function () {
          let entityName = $(this).siblings("prov\\:entity").attr("prov:ref");
          let role = $(this).siblings("prov\\:role").text();
          let owners = getEntityOwners(entityName, $(this).parent().parent());
          let type = getEntityType(entityName, $(this).parent().parent());
					usedEntities.push({name: entityName, role: role, owners: owners, type: type});
				});
		return usedEntities;
	}

	function getEntityOwners(entity, element) {
		const attributedAgents = [];
		// select agents that the entity given as parameter is attributed to
		element.find(querySelectorPrefix + "wasAttributedTo ").find(querySelectorPrefix + "entity[prov\\:ref='" + entity + "']")
				.each(function () {
          let agentName = $(this).siblings("prov\\:agent").attr("prov:ref");
          let agentData = getAgentByName(agentName, doc);
					attributedAgents.push(agentData);
				});
		return attributedAgents;
	}

	function getOwnerOfType(entity, ownerType) {
		let owner = null;
		entity.owners.forEach(function (oneOwner) {
			if (oneOwner.type === "prov:" + ownerType) {
				owner = oneOwner;
			}
		});
		return owner;
	}

	function getEntityType(entity, element) {
		// select agents that the entity given as parameter is attributed to
    let firstEntity = element.find(querySelectorPrefix + "entity[prov\\:id='" + entity + "']").find(querySelectorPrefix + "type");
		return firstEntity.text();
	}

});