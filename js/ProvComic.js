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

var ProvComic = function (element) {
	this.comic = $(element);
	this.personDepicted = false;
	this.previousDevice = null;
};

ProvComic.prototype = function () {
	var addPanel = function (id) {
		// add the panel to the comic
		var newPanel = new Panel(id);
		newPanel.insertInto(this);
		return newPanel;
	};
	var addPanelGroup = function (cssclass) {
		// add the panel to the comic
		var newPanelGroup = new PanelGroup(cssclass);
		newPanelGroup.insertInto(this);
		return newPanelGroup;
	};

	//public members
	return {
		addPanel: addPanel,
		addPanelGroup: addPanelGroup
	};
}();





var Panel = function (id) {
	this.panel = $("<div/>");		// create a <div>
	this.panel.attr("id", id);		// add an ID to it
	this.panel.addClass("panel");	// add CSS class to it
	return this;
};

Panel.prototype = function () {
	var insertInto = function (element) {
		element.append(this.panel);
	};

	var addIntro = function (intro) {
		if (typeof (intro) === "string") {
			this.panelIntro = $("<div>" + intro + "</div>");
			this.panelIntro.addClass("panel-intro");
			this.panel.prepend(this.panelIntro);
		}
	};

	var addDateIntro = function (date) {
		if (typeof (date) === "string" && date !== "") {
			this.addIntro("On <strong>" + formatDate(date) + "</strong>" +
					" at <strong>" + formatTime(date) + "</strong>");
		}
	};

	var formatDate = function (date) {
		var monthNames = ["January", "February", "March", "April", "May", "June",
			"July", "August", "September", "October", "November", "December"];
		var formattedDate = new Date(date);
		var day = formattedDate.getDate();
		var month = monthNames[formattedDate.getMonth()];
		var year = formattedDate.getFullYear();
		return month + " " + day + ", " + year;
	};

	var formatTime = function (date) {
		var formattedDate = new Date(Date.parse(date));
		var hour = formattedDate.getUTCHours();
		var minute = (formattedDate.getMinutes() < 10 ? '0' : '') + formattedDate.getMinutes();
		var ampm = "am";
		if (hour > 12) {
			ampm = "pm";
			hour -= 12;
		}
		return hour + ":" + minute + " " + ampm;
	};

	var addOrganization = function (label) {
		var div = $("<div/>");
		var img = $("<img/>");
		img.attr("src", "img/organization.png");
		var text = addText(label);
		div.addClass("agent organization").append(img).append(text);
		this.panel.append(div);
		return div;
	};

	var addEntity = function (entityType, targetElement, cssClass, fileType) {
		var div = $("<div/>");
		var img = $("<img/>");
		var textOrIcon = null;
		if (entityType === "missing" || entityType === "aggregated") {
			img.attr("src", "img/entity-" + entityType + ".png");

		} else if (entityType === "linechart" || entityType === "barchart") {
			img.attr("src", "img/graphic-" + entityType + ".png");
			var text = addText("t", "time");
			div.append(text);

		} else {
			if (typeof (fileType) !== "undefined") {
				img.attr("src", "img/document.png");
				var appear = $("<img/>");
				appear.attr("src", "img/appear.png").addClass("appear");
				div.append(appear);
				var text = addText(fileType);
				div.append(text);
			} else {
				img.attr("src", "img/entity.png");
			}
			if (typeof (entityType) === "string") {
				var checkTypes = ["bloodpressure", "heartrate", "sleep", "steps", "weight"];
				textOrIcon = addText(entityType);
				checkTypes.forEach(function (type) {
					if (entityType.indexOf(type) > -1) {
						textOrIcon = $("<img/>");
						textOrIcon.attr("src", "img/icon-" + type + ".png");
						textOrIcon.addClass(type);
						return;
					}
				});
			} else {
				// TODO: if no type is given, add a "?" or similar as icon
				// => somewhat like this:
//				textOrIcon = $("<img/>");
//				textOrIcon.attr("src", "img/icon-questionmark.png");
			}
			textOrIcon.addClass("icon");
		}
		div.addClass("entity").append(img).append(textOrIcon);
		div.addClass(cssClass);
		targetElement.append(div);
		return div;
	};

	var addButton = function (label) {
		var div = $("<div/>");
		var text = addText(label);
		div.addClass("button").append(text);
		this.panel.append(div);
		return div;
	};

	var addButtonPress = function () {
		var div = $("<div/>");
		var img = $("<img/>");
		img.attr("src", "img/button-press.png");
		div.addClass("button-press").append(img);
		this.panel.append(div);
		return div;
	};

	var addIcon = function (dataType, className) {
		var img = $("<img/>");
		img.attr("src", "img/icon-" + dataType + ".png");
		img.addClass("aggregate-icon " + className).append(img);
		this.panel.append(img);
		return img;
	};

	var addPlus = function () {
		var text = addText("+", "plus");
		this.panel.append(text);
		return text;
	};

	var addTinyIcon = function (dataType) {
		var div = $("<div/>");
		var img = $("<img/>");
		img.attr("src", "img/icon-tiny-" + dataType + ".png");
		div.addClass("tiny-icon").append(img);
		this.panel.append(div);
		return div;
	};

	var addCloudSync = function (label, targetElement) {
		var div = $("<div/>");
		var img = $("<img/>");
		img.attr("src", "img/cloud.png");
		var text = addText(label);
		div.addClass("cloud-sync").append(img).append(text);
		targetElement.append(div);
		return div;
	};

	/**
	 * 
	 * @param {type} direction "upload" or "download"
	 * @returns {ProvComic_L43.addSyncArrow.div}
	 */
	var addSyncArrow = function (direction) {
		var div = $("<div/>");
		var img = $("<img/>");
		img.attr("src", "img/" + direction + ".png");
		div.addClass("arrow-" + direction).append(img);
		this.panel.append(div);
		return div;
	};

	var addCheckmark = function (targetElement) {
		var div = $("<div/>");
		var img = $("<img/>");
		img.attr("src", "img/checkmark.png");
		div.addClass("checkmark").append(img);
		targetElement.append(div);
		return div;
	};

	var addSoftwareAgent = function (label, device) {
		var div = $("<div/>");
		var img = $("<img/>");
		var cssClass = "";
		if (typeof (device) === "string") {
			switch (device) {
				case "computer" :
					img.attr("src", "img/softwareagent-computer.png");
					cssClass = " computer";
					break;
				default :
					img.attr("src", "img/softwareagent.png");
			}
		} else {
			img.attr("src", "img/softwareagent.png");
		}
		var text = addText(label);
		div.addClass("agent softwareagent " + cssClass).append(img).append(text);
		this.panel.append(div);
		return div;
	};

	var addTable = function (targetElement) {
		var div = $("<div/>");
		var img = $("<img/>");
		img.attr("src", "img/table.png");
		div.addClass("table").append(img);
		targetElement.append(div);
		return div;
	};

	var addPerson = function (label, device, hideUsername) {
		var div = $("<div/>");
		var img = $("<img/>");
		var cssClass = "";
		if (typeof (device) === "string") {
			switch (device) {
				case "computer" :
					img.attr("src", "img/person-computer.png");
					cssClass = "personcomputer";
					break;
				default :
					img.attr("src", "img/person-" + device + ".png");
					cssClass = "person";
					if (device.indexOf("zoom") > -1) {
						cssClass += " zoom";
					}
			}
		} else {
			img.attr("src", "img/person-smartphone.png");
		}
		div.addClass("agent " + cssClass).append(img);
		if (!hideUsername) {
			var text = addText(label);
			var firstLetter = addText(label.substr(0, 1), "first-letter");
			div.append(text).append(firstLetter);
		}
		this.panel.append(div);
		return div;
	};

	var addText = function (label, cssClass) {
		var span = $("<span/>");
		if (cssClass !== null) {
			span.addClass(cssClass);
		}
		span.append(label);
		return span;
	};

	//public members
	return {
		addButton: addButton,
		addButtonPress: addButtonPress,
		addCheckmark: addCheckmark,
		addCloudSync: addCloudSync,
		addIntro: addIntro,
		addDateIntro: addDateIntro,
		addEntity: addEntity,
		addOrganization: addOrganization,
		addPerson: addPerson,
		addSoftwareAgent: addSoftwareAgent,
		addSyncArrow: addSyncArrow,
		addIcon: addIcon,
		addTinyIcon: addTinyIcon,
		addPlus: addPlus,
		addTable: addTable,
		insertInto: insertInto
	};
}();










var PanelGroup = function (cssclass) {
	this.panelGroup = $("<div/>");			// create a <div>
	this.panelGroup.addClass("panelgroup");	// add CSS class to it
	this.panelGroup.addClass(cssclass);		// add CSS class to it
	this.parentComic = null;

	this.personPanelNeeded = function (activity) {
		return (
				this.parentComic === null
				|| this.parentComic.previousDevice !== activity.softwareAgent.device
				|| !this.parentComic.personDepicted
				);
	}

	this.setPersonDepicted = function (activity) {
		this.parentComic.personDepicted = true;
		this.parentComic.previousDevice = activity.softwareAgent.device;
	}

	return this;
};

PanelGroup.prototype = function () {
	//private members
	var insertInto = function (element) {
		this.parentComic = element;
		element.comic.append(this.panelGroup);
	};

	var addPanel = function () {
		// add the panel to the comic
		var newPanel = new Panel();
		newPanel.insertInto(this.panelGroup);
		return newPanel;
	};

	var addInputPanels = function (activity, entity, owner) {
		if (this.personPanelNeeded(activity)) {
			var panel0 = this.addPanel();
			panel0.addDateIntro(activity.time);
			panel0.addPerson(owner.name, entity.type);
			this.setPersonDepicted(activity);
		}

		var panel1 = this.addPanel();
		panel1.addPerson(owner.name, entity.type + "-zoom", true);

		var panel2 = this.addPanel();
		panel2.addPerson(owner.name, activity.softwareAgent.device, true);

		var panel3 = this.addPanel();
		var sw = panel3.addSoftwareAgent(activity.softwareAgent.name, activity.softwareAgent.device);
		panel3.addTable(sw); // input table on the computer

		var panel4 = this.addPanel();
		var sw = panel4.addSoftwareAgent(activity.softwareAgent.name, activity.softwareAgent.device);
		panel4.addEntity(entity.type, sw, "computer"); // entity on the phone
		panel4.addCheckmark(sw);
	};

	var addDownloadPanels = function (activity, entity, owner, hoster) {
		if (this.personPanelNeeded(activity)) {
			var panel0 = this.addPanel();
			panel0.addDateIntro(activity.time);
			panel0.addPerson(owner.name, activity.softwareAgent.device);
			this.setPersonDepicted(activity);
		}

		var panel1 = this.addPanel();
		var org = panel1.addOrganization(hoster.name);
		panel1.addEntity(entity.type, org, "remote"); // entity on the server
		var sw = panel1.addSoftwareAgent(activity.softwareAgent.name, activity.softwareAgent.device);
		panel1.addEntity("missing", sw, "local"); // entity on the phone

		var panel2 = this.addPanel();
		org = panel2.addOrganization(hoster.name);
		panel2.addEntity(entity.type, org, "remote"); // entity on the server
		sw = panel2.addSoftwareAgent(activity.softwareAgent.name, activity.softwareAgent.device);
		panel2.addCloudSync("Downloading...", sw);
		panel2.addSyncArrow("download");
		panel2.addEntity(entity.type, panel2.panel, "syncing"); // entity on its way to the phone

		var panel3 = this.addPanel();
		org = panel3.addOrganization(hoster.name);
		panel3.addEntity(entity.type, org, "remote"); // entity on the server
		sw = panel3.addSoftwareAgent(activity.softwareAgent.name, activity.softwareAgent.device);
		panel3.addEntity(entity.type, sw, "local"); // entity on the phone
		panel3.addCheckmark(sw);
	};

	var addUploadPanels = function (activity, entity, owner, hoster) {
		if (this.personPanelNeeded(activity)) {
			var panel0 = this.addPanel();
			panel0.addDateIntro(activity.time);
			panel0.addPerson(owner.name, activity.softwareAgent.device);
			this.setPersonDepicted(activity);
		}

		var panel1 = this.addPanel();
		panel1.addOrganization(hoster.name);
		var sw = panel1.addSoftwareAgent(activity.softwareAgent.name, activity.softwareAgent.device);
		panel1.addEntity(entity.type, sw, "local"); // entity on the phone

		var panel2 = this.addPanel();
		panel2.addOrganization(hoster.name);
		sw = panel2.addSoftwareAgent(activity.softwareAgent.name, activity.softwareAgent.device);
		panel2.addCloudSync("Uploading...", sw);
		panel2.addSyncArrow("upload");
		panel2.addEntity(entity.type, panel2.panel, "syncing"); // entity on its way to the server

		var panel3 = this.addPanel();
		var org = panel3.addOrganization(hoster.name);
		panel3.addEntity(entity.type, org, "remote"); // entity on the server
		sw = panel3.addSoftwareAgent(activity.softwareAgent.name, activity.softwareAgent.device);
		panel3.addEntity(entity.type, sw, "local"); // entity on the phone
		panel3.addCheckmark(sw);
	};

	var addVisualizePanels = function (activity, entityBefore, entityAfter, owner) {
		if (this.personPanelNeeded(activity)) {
			var panel0 = this.addPanel();
			panel0.addDateIntro(activity.time);
			panel0.addPerson(owner.name, activity.softwareAgent.device);
			this.setPersonDepicted(activity);
		}

		var panel1 = this.addPanel();
		var sw = panel1.addSoftwareAgent(activity.softwareAgent.name, activity.softwareAgent.device);
		panel1.addEntity(entityBefore.type, sw); // entity on the phone
		panel1.addButton("View graph"); // button

		var panel2 = this.addPanel();
		sw = panel2.addSoftwareAgent(activity.softwareAgent.name, activity.softwareAgent.device);
		panel2.addEntity(entityBefore.type, sw); // entity on the phone
		panel2.addButton("View graph"); // button
		panel2.addButtonPress();

		var panel3 = this.addPanel();
		sw = panel3.addSoftwareAgent(activity.softwareAgent.name, activity.softwareAgent.device);
		panel3.addEntity(entityAfter.type, sw, "visualization");
		panel3.addTinyIcon(entityBefore.type);
	};

	var addExportPanels = function (activity, entityBefore, entityAfter, owner) {
		if (this.personPanelNeeded(activity)) {
			var panel0 = this.addPanel();
			panel0.addDateIntro(activity.time);
			panel0.addPerson(owner.name, activity.softwareAgent.device);
			this.setPersonDepicted(activity);
		}

		var panel1 = this.addPanel();
		var sw = panel1.addSoftwareAgent(activity.softwareAgent.name, activity.softwareAgent.device);
		panel1.addEntity(entityBefore.type, sw); // entity on the phone
		panel1.addButton("Export " + entityAfter.type.toUpperCase()); // button

		var panel2 = this.addPanel();
		sw = panel2.addSoftwareAgent(activity.softwareAgent.name, activity.softwareAgent.device);
		panel2.addEntity(entityBefore.type, sw); // entity on the phone
		panel2.addButton("Export " + entityAfter.type.toUpperCase()); // button
		panel2.addButtonPress();

		var panel3 = this.addPanel();
		sw = panel3.addSoftwareAgent(activity.softwareAgent.name, activity.softwareAgent.device);
		panel3.addEntity(entityBefore.type, sw, "export", entityAfter.type);
		panel3.addCheckmark(sw);
	};

	var addAggregatePanels = function (activity, owner) {
		if (this.personPanelNeeded(activity)) {
			var panel0 = this.addPanel();
			panel0.addDateIntro(activity.time);
			panel0.addPerson(owner.name, activity.softwareAgent.device);
			this.setPersonDepicted(activity);
		}

		var panel1 = this.addPanel();
		var sw = panel1.addSoftwareAgent(activity.softwareAgent.name, activity.softwareAgent.device);
		for (var i = 0; i < activity.usedEntities.length; i++) {
			var entity = activity.usedEntities[i];
			panel1.addEntity(entity.type, sw, "entity" + (i + 1)); // entity on the phone
			if (i < activity.usedEntities.length - 1) {
				panel1.addPlus();
			}
		}
		;
		panel1.addButton("Combine"); // button

		var panel2 = this.addPanel();
		sw = panel2.addSoftwareAgent(activity.softwareAgent.name, activity.softwareAgent.device);
		for (var i = 0; i < activity.usedEntities.length; i++) {
			var entity = activity.usedEntities[i];
			panel2.addEntity(entity.type, sw, "entity" + (i + 1)); // entity on the phone
			if (i < activity.usedEntities.length - 1) {
				panel2.addPlus();
			}
		}
		;
		panel2.addButton("Combine"); // button
		panel2.addButtonPress();

		var panel3 = this.addPanel();
		sw = panel3.addSoftwareAgent(activity.softwareAgent.name, activity.softwareAgent.device);
		panel3.addEntity("aggregated", sw, "aggregated");
		for (var i = 0; i < activity.usedEntities.length; i++) {
			var entity = activity.usedEntities[i];
			panel3.addIcon(entity.type, "aggregate-icon-" + (i + 1)); // entity on the phone
		}
		;
		panel3.addCheckmark(sw);
	};

	//public members
	return {
		addPanel: addPanel,
		addAggregatePanels: addAggregatePanels,
		addDownloadPanels: addDownloadPanels,
		addExportPanels: addExportPanels,
		addInputPanels: addInputPanels,
		addUploadPanels: addUploadPanels,
		addVisualizePanels: addVisualizePanels,
		insertInto: insertInto
	};
}();