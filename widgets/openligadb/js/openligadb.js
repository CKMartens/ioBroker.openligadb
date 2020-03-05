/*
    ioBroker.vis openligadb Widget-Set

    Copyright 2020 oweitman oweitman@gmx.de
    
*/
"use strict";

// add translations for edit mode
if (vis.editMode) {
    $.extend(true, systemDictionary, {
        "allmatches_oid": {"en": "allmatches", "de": "allmatches", "ru": "allmatches"},
        "currgameday_oid": {"en": "currgameday", "de": "currgameday", "ru": "currgameday"},
        "showgameday": {"en": "showgameday", "de": "showgameday", "ru": "showgameday"},
        "showgamedaycount": {"en": "showgamedaycount", "de": "showgamedaycount", "ru": "showgamedaycount"},
        "maxicon": {"en": "maxicon", "de": "maxicon", "ru": "maxicon"},
        "shortname": {"en": "shortname", "de": "shortname", "ru": "shortname"},
        "showgoals": {"en": "showgoals", "de": "showgoals", "ru": "showgoals"},
        "showweekday": {"en": "showweekday", "de": "showweekday", "ru": "showweekday"},
        });
}

vis.binds["openligadb"] = {
    version: "0.5.0",
    showVersion: function () {
        if (vis.binds["openligadb"].version) {
            console.log('Version openligadb: ' + vis.binds["openligadb"].version);
            vis.binds["openligadb"].version = null;
        }
    },
    
    pivottable: {
        createWidget: function (widgetID, view, data, style) {
            
            var $div = $('#' + widgetID);
            // if nothing found => wait
            if (!$div.length) {
                return setTimeout(function () {
                    vis.binds["openligadb"].pivottable.createWidget(widgetID, view, data, style);
                }, 100);
            }
            var allmatches  = data.allmatches_oid ? JSON.parse(vis.states.attr(data.allmatches_oid + '.val')) : {};
            var currgameday = data.currgameday_oid ? JSON.parse(vis.states.attr(data.currgameday_oid + '.val')) : {};
            var maxicon = data.maxicon || 25;
            var shortname = data.shortname || false;
            var highlight = data.highlight || '';
            var sort = data.sort || 'table';
            var highlightontop = data.highlightontop || false;
            
            
            function onChange(e, newVal, oldVal) {
                vis.binds["openligadb"].pivottable.createWidget(widgetID, view, data, style);
            }

            if (data.allmatches_oid && data.currgameday_oid) {
                if (1 || !vis.editMode) {
                    vis.binds["openligadb"].bindStates($div,[data.allmatches_oid,data.currgameday_oid],onChange);                    
                }
            }            
                                    
            var pivottable = allmatches.reduce(function(collect,item){
                if (collect.hasOwnProperty(item.Team1.TeamName)) {                
                    var team =collect[item.Team1.TeamName];
                } else {
                    var team = {
                        "TeamName":             item.Team1.TeamName,
                        "ShortName":            item.Team1.ShortName,
                        "TeamIconUrl":          item.Team1.TeamIconUrl,
                        "Gamedays":             []
                    }
                }
                var result = vis.binds["openligadb"].getResult(item.MatchResults);
                var team1result = result.hasOwnProperty('PointsTeam1') ? result.PointsTeam1 : '-';
                var team2result = result.hasOwnProperty('PointsTeam2') ? result.PointsTeam2 : '-';
                var game = {
                        "MatchDateTime":        item.MatchDateTime,
                        "Result":               team1result + ':'+ team2result,
                        "GroupName":            item.Group.GroupName,
                        "GroupOrderID":         item.Group.GroupOrderID,
                        "TeamName":             item.Team2.TeamName,
                        "ShortName":            item.Team2.ShortName,
                        "TeamIconUrl":          item.Team2.TeamIconUrl
                };
                
                team.Gamedays[item.Team2.TeamName] = game;
                collect[item.Team1.TeamName] = team;
                return collect;
                
            },[]);
            var table = vis.binds["openligadb"].table3.calcTable(allmatches, 1, currgameday, currgameday);
            var newtable = new Array();
            for (var items in table){
                newtable.push( table[items] );
            }
            if (sort=='table') {
                table = newtable.sort(function(a,b) {
                    return (a.Points > b.Points) ? -1 : ((b.Points > a.Points) ? 1 : (a.GoalDiff<b.GoalDiff) ? 1: (a.GoalDiff>b.GoalDiff)? -1:0);
                });
            }
            if (sort=='name') {
                table = newtable.sort(function(a,b) {
                    var name1,name2
                    name1 = (shortname)? a.ShortName : a.TeamName;
                    name2 = (shortname)? b.ShortName : b.TeamName;
                    return (name1 > name2) ? 1 : (name1 < name2) ? -1:0;
                });
            }
            if (highlightontop) {
                if (highlight.trim()!='') {
                    var tophighlight = highlight.split(';');
                    tophighlight = tophighlight.reverse();
                    for (var i=0;i<tophighlight.length;i++) {
                        var topindex = table.findIndex(function(item){
                            return item.TeamName.toLowerCase().indexOf(tophighlight[i].toLowerCase())>=0; 
                        });
                        if (topindex>0) table.splice(0,0,table.splice(topindex,1)[0]);
                    }
                }
            }
            
            var text ='';
            
            text += '<style> \n';
            text += '#'+widgetID + ' .oldb-icon {\n';
            text += '   max-height: ' + maxicon + 'px; \n';
            text += '   max-width: ' + maxicon + 'px; \n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-center {\n';
            text += '   text-align: center;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-tt td{\n';
            text += '   white-space: nowrap;\n';
            text += '} \n';            
            text += '#'+widgetID + ' .oldb-full {\n';
            text += '   width: 100%;\n';
            text += '} \n';                                    
            text += '</style> \n';            
            
            text += '<table class="oldb-tt">';
            text += '        <tr>';
            text += '           <th class="oldb-center oldb-rank">#</th><th></th><th></th>';
            table.forEach(function(team, index) {
                text += '           <th class="oldb-center oldb-tdicon">';
                text += '              <img class="oldb-icon" src="'+team.TeamIconUrl+'">';
                text += '           </th>';                
            });
            text += '           <th class="oldb-center oldb-goaldiff">Diff</th><th class="oldb-center oldb-points">Punkte</th>';
            text += '        </tr>';            
            var pteam1,pteam2;            
            table.forEach(function(team1, index) {
                pteam1 = pivottable[team1.TeamName];
                var team1name = shortname ? team1.ShortName : team1.TeamName;
                if (vis.binds["openligadb"].checkHighlite(team1.TeamName,highlight)) team1name = '<b class="favorite">' + team1name + '</b>';                
                text += '        <tr>';
                text += '            <td class="oldb-center oldb-rank">';
                text += team1.ranking[team1.ranking.length-1];
                text += '            </td>';                
                text += '           <td class="oldb-center oldb-tdicon">';
                text += '              <img class="oldb-icon" src="'+team1.TeamIconUrl+'">';
                text += '           </td>';
                text += '           <td class="oldb-teamname oldb-full">'+team1name+'</td>';
                table.forEach(function(team2, index) {
                    if (team1.TeamName==team2.TeamName) {
                        text += '           <td class=""></td>';
                        return;
                    }
                    var result = pteam1.Gamedays[team2.TeamName].Result;
                    text += '           <td class="oldb-center oldb-result">'+result+'</td>';
                });
                text += '           <td class="oldb-center oldb-goaldiff">'+team1.GoalDiff+'</td>';
                text += '           <td class="oldb-center oldb-points">'+team1.Points+'</td>';                
                text += '        </tr>';
            });
            text += '</table>';
            $('#' + widgetID).html(text);
        },    
    },
            
    goalgetters: {
        createWidget: function (widgetID, view, data, style) {
            
            var $div = $('#' + widgetID);
            // if nothing found => wait
            if (!$div.length) {
                return setTimeout(function () {
                    vis.binds["openligadb"].goalgetters.createWidget(widgetID, view, data, style);
                }, 100);
            }
            
            var goalgetters  = data.goalgetters_oid ? JSON.parse(vis.states.attr(data.goalgetters_oid + '.val')) : {};
            var maxcount = data.maxcount || 99999;
            var sort = data.sort || 'goal';
            var highlight = data.highlight || '';
            var showonlyhighlight = data.showonlyhighlight || false;
            
            function onChange(e, newVal, oldVal) {
                vis.binds["openligadb"].goalgetters.createWidget(widgetID, view, data, style);
            }

            if (data.goalgetters_oid) {
                if (1 || !vis.editMode) {
                    vis.binds["openligadb"].bindStates($div,[data.goalgetters_oid],onChange);                    
                }
            }            
                                   
            goalgetters = this.setName(goalgetters);
            
            if (sort=='goal') {
                goalgetters = goalgetters.sort(function(a,b){
                   return b.GoalCount-a.GoalCount;
                });
            }
            if (sort=='name') {
                goalgetters = goalgetters.sort(function(a,b){
                    return ('' + a.lastname + ' ' + a.prename).localeCompare('' + b.lastname + ' ' + b.prename);
                });
            }
            
            var text ='';

            text += '<style> \n';
            text += '#'+widgetID + ' .oldb-tt td{\n';
            text += '   white-space: nowrap;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-left {\n';
            text += '   text-align: left;\n';
            text += '} \n';            
            text += '</style> \n';            
            
            text += '<table class="oldb-gg">';
            text += '        <tr>';
            text += '           <th class="oldb-left">Name</td>';
            text += '           <th class="oldb-left">Tore</td>';
            text += '        </tr>';
            var count=0;
            goalgetters.forEach(function(goalgetter, index) {
                
                if (count<maxcount) {
                    
                    var name = '';
                    name += goalgetter.lastname;
                    (goalgetter.prename) ? name += ', ' + goalgetter.prename : name += goalgetter.prename;
                    var check = vis.binds["openligadb"].checkHighlite(name,highlight);
                    if (check) name = '<b>'+name+'</b>';
                    
                    if (!showonlyhighlight || showonlyhighlight && check) {
                        text += '        <tr>';
                        text += '           <td class="oldb-left">'+ name +'</td>';
                        text += '           <td class="oldb-left">'+ goalgetter.GoalCount  +'</td>';
                        text += '        </tr>';
                        count++;
                    }
                }
            });
            text += '</table>            ';            
            $('#' + widgetID).html(text);            
        },         
        setName: function(goalgetters) {
            var arr;
            goalgetters.forEach(function(goalgetter, index) {
                const regex_c1 = /(.+), ?(.+)/g;
                const regex_c2 = /(.+)\. ?(.+)/g;
                var name = goalgetter.GoalGetterName.trim();
                goalgetter.ok = false;
                arr = regex_c1.exec(name);
                if ((arr) && arr[1] && arr[2]) {
                    goalgetter.prename = arr[2];
                    goalgetter.lastname = arr[1];
                    goalgetter.ok = true;
                    return;
                }
                arr = regex_c2.exec(name);
                if ((arr) && arr[1] && arr[2]) {
                    goalgetter.lastname = arr[2];
                    goalgetter.prename = arr[1] + '.';
                    goalgetter.ok = true;
                    return;
                }
                arr = name.split(' ');
                if ((arr) && arr.length>1) {
                    goalgetter.lastname = arr.pop();
                    goalgetter.prename = arr.join(' ');  
                    goalgetter.ok = true;
                    return;
                }
                if ((arr) && arr.length==1) {
                    goalgetter.lastname = arr.pop();
                    goalgetter.prename = '';  
                    goalgetter.ok = true;
                }                
            });
            return goalgetters;
        },    
    },

    favgames2: {
        createWidget: function (widgetID, view, data, style) {
            
            var $div = $('#' + widgetID);
            // if nothing found => wait
            if (!$div.length) {
                return setTimeout(function () {
                    vis.binds["openligadb"].favgames2.createWidget(widgetID, view, data, style);
                }, 100);
            }
            var favgames = [];
            var showabbreviation = data.showabbreviation || false;
            var showweekday = data.showweekday || false;
            var showresult = data.showresult || false;
            var maxicon = data.maxicon || 25;
            var nohighlight = '';
            var bound = [];

            for (var i = 1; i <= data.lCount; i++) {

                var allmatches  = data['allmatches_oid'+i] ? JSON.parse(vis.states.attr( data['allmatches_oid'+i] + '.val')) : {};
                var currgameday = data['currgameday_oid'+i] ? JSON.parse(vis.states.attr(data['currgameday_oid'+i] + '.val')) : {};
                bound.push(data['allmatches_oid'+i]);
                bound.push(data['currgameday_oid'+i]);
                var showgameday = data['showgameday'+i] || '';
                if (vis.editMode && /{.*}/gm.test(showgameday))  showgameday = '';
                if (showgameday==0) showgameday='';
                showgameday = showgameday || currgameday || '';
                var showgamedaycount = data['showgamedaycount'+i] || 9999;
                if (showgamedaycount==0) showgamedaycount = 9999;

                var abbreviation = data['abbreviation'+i] || '';
                var shortname = data['shortname'+i] || false;
                var highlight = data['highlight'+i] || '';

                favgames=favgames.concat(this.filterFavGames(allmatches, showgameday, showgamedaycount, currgameday, highlight,shortname,abbreviation));  
                if (highlight=='') nohighlight += 'group'+i+' ';
            }

            function onChange(e, newVal, oldVal) {
                vis.binds["openligadb"].favgames2.createWidget(widgetID, view, data, style);
            }

            if (bound) {
                if (1 || !vis.editMode) {
                    vis.binds["openligadb"].bindStates($div,bound,onChange);                    
                }
            }            
            


            
            favgames = this.sortFavGames(favgames);

            var weekday_options = { weekday: 'short' };
            //var date_options = { year: 'numeric', month: '2-digit', day: '2-digit' };
            var date_options = { month: '2-digit', day: '2-digit' };
            var time_options = { hour: '2-digit', minute: '2-digit' };            
            var text ='';
            
            text += '<style> \n';
            text += '#'+widgetID + ' .oldb-icon {\n';
            text += '   max-height: ' + maxicon + 'px; \n';
            text += '   max-width: ' + maxicon + 'px; \n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-tdicon {\n';
            text += '   width: ' + maxicon + 'px; \n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-tt {\n';
            text += '   width: 100%;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-tt td{\n';
            text += '   white-space: nowrap;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-full {\n';
            text += '   width: 50%;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-center {\n';
            text += '   text-align: center;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-right {\n';
            text += '   text-align: right;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-left {\n';
            text += '   text-align: left;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-datetime {\n';
            text += '       font-weight: bold;\n';
            text += '} \n';            
            text += '</style> \n';
            
            text += '<table class="oldb-tt">';

            favgames.forEach(function(match, index) {
                var team1name = match.shortname ? match.Team1.ShortName : match.Team1.TeamName;
                var team2name = match.shortname ? match.Team2.ShortName : match.Team2.TeamName;
                if (vis.binds["openligadb"].checkHighlite(team1name,match.highlight)) team1name = '<b class="favorite">' + team1name + '</b>';
                if (vis.binds["openligadb"].checkHighlite(team2name,match.highlight)) team2name = '<b class="favorite">' + team2name + '</b>';
                var result = vis.binds["openligadb"].getResult(match.MatchResults);
                var team1result = result.hasOwnProperty('PointsTeam1') ? result.PointsTeam1 : '-';
                var team2result = result.hasOwnProperty('PointsTeam2') ? result.PointsTeam2 : '-';
                
                var today = new Date();
                var mdate = vis.binds["openligadb"].getDateFromJSON(match.MatchDateTime);
                (vis.binds["openligadb"].compareDate(today,mdate)) ? text += '        <tr class="todaygame">' : text += '        <tr>';

                if (showweekday) text += '           <td class="oldb-left">'+ vis.binds["openligadb"].getDateFromJSON(match.MatchDateTime).toLocaleString(vis.language,weekday_options)  +'</td>';
                text += '           <td class="oldb-left">'+ vis.binds["openligadb"].getDateFromJSON(match.MatchDateTime).toLocaleString(vis.language,date_options)  +'</td>';
                text += '           <td class="oldb-left">'+ vis.binds["openligadb"].getDateFromJSON(match.MatchDateTime).toLocaleString(vis.language,time_options)  +'</td>';
                if (showabbreviation) text += '           <td class="oldb-left">'+ match.abbreviation +'</td>';
                text += '           <td class="oldb-center oldb-tdicon">';
                text += '              <img class="oldb-icon" src="'+match.Team1.TeamIconUrl+'">';
                text += '           </td>';
                text += '           <td class="oldb-full">'+ team1name +'</td>';
                if (showresult) text += '           <td class="oldb-left">'+team1result+'</td>';
                text += '           <td class="oldb-left">:</td>';
                if (showresult) text += '           <td class="oldb-left">'+team2result+'</td>';
                text += '           <td class="oldb-center oldb-tdicon">';
                text += '              <img class="oldb-left oldb-icon" src="'+match.Team2.TeamIconUrl+'">';
                text += '           </td>';
                text += '           <td class="oldb-full">'+ team2name +'</td>';                
                text += '        </tr>';
            });
            if (nohighlight != '') text += '<tr><td>No filter set for: ' + nohighlight + '</td></tr>';
            text += '</table>            ';            
            $('#' + widgetID).html(text);            

        },
        filterFavGames: function(allmatches,gameday,gamedaycount,currgameday,highlight,shortname, abbreviation) {
            if (!Array.isArray(allmatches)) return [];
            gameday = parseInt(gameday);
            gamedaycount = parseInt(gamedaycount);
            currgameday = parseInt(currgameday);
            
            return allmatches.reduce(function(result,item){
                var found;
                item.abbreviation = abbreviation;
                if (gameday > 0 && item.Group.GroupOrderID >= gameday && item.Group.GroupOrderID < gameday + gamedaycount ) found=item;
                if (gameday < 0 && item.Group.GroupOrderID >= currgameday + gameday && item.Group.GroupOrderID < currgameday + gameday + gamedaycount) found=item;
                item.highlight=highlight;
                item.shortname=shortname;
                if (found && (vis.binds["openligadb"].checkHighlite(item.Team1.TeamName,highlight) || vis.binds["openligadb"].checkHighlite(item.Team2.TeamName,highlight)) ) result.push(item);
                return result;
            },[]);            
        },
        sortFavGames: function(favgames) {
            return favgames.sort(function(a,b){
                var comp = 0;
                if (vis.binds["openligadb"].getDateFromJSON(a.MatchDateTime).getTime()>vis.binds["openligadb"].getDateFromJSON(b.MatchDateTime).getTime()) comp=1;
                if (vis.binds["openligadb"].getDateFromJSON(a.MatchDateTime).getTime()<vis.binds["openligadb"].getDateFromJSON(b.MatchDateTime).getTime()) comp=-1;
                return comp;
            });
        },
    },         
    
    favgames: {
        createWidget: function (widgetID, view, data, style) {
            
            var $div = $('#' + widgetID);
            // if nothing found => wait
            if (!$div.length) {
                return setTimeout(function () {
                    vis.binds["openligadb"].favgames.createWidget(widgetID, view, data, style);
                }, 100);
            }
            var allmatches  = data.allmatches_oid ? JSON.parse(vis.states.attr(data.allmatches_oid + '.val')) : {};
            var currgameday = data.currgameday_oid ? JSON.parse(vis.states.attr(data.currgameday_oid + '.val')) : {};
            var showgameday = data.showgameday || '';
            if (vis.editMode && /{.*}/gm.test(showgameday))  showgameday = '';
            if (showgameday==0) showgameday='';
            showgameday = showgameday || currgameday || '';
            var showgamedaycount = data.showgamedaycount || 9999;
            if (showgamedaycount==0) showgamedaycount = 9999;

            var maxicon = data.maxicon || 25;
            var shortname = data.shortname || false;
            var highlight = data.highlight || '';
            
            var favgames = this.filterFavGames(allmatches, showgameday, showgamedaycount, currgameday, highlight);  
            
            //var date_options = { year: 'numeric', month: '2-digit', day: '2-digit' };
            var date_options = { month: '2-digit', day: '2-digit' };
            var time_options = { hour: '2-digit', minute: '2-digit' };            
            var text ='';
            
            text += '<style> \n';
            text += '#'+widgetID + ' .oldb-icon {\n';
            text += '   max-height: ' + maxicon + 'px; \n';
            text += '   max-width: ' + maxicon + 'px; \n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-tdicon {\n';
            text += '   width: ' + maxicon + 'px; \n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-tt {\n';
            text += '   width: 100%;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-tt td{\n';
            text += '   white-space: nowrap;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-full {\n';
            text += '   width: 50%;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-center {\n';
            text += '   text-align: center;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-right {\n';
            text += '   text-align: right;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-left {\n';
            text += '   text-align: left;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-datetime {\n';
            text += '       font-weight: bold;\n';
            text += '} \n';            
            text += '</style> \n';
            
            text += '<table class="oldb-tt">';

            favgames.forEach(function(match, index) {
                var team1name = shortname ? match.Team1.ShortName : match.Team1.TeamName;
                var team2name = shortname ? match.Team2.ShortName : match.Team2.TeamName;
                
                text += '        <tr>';
                text += '           <td class="oldb-left">'+ vis.binds["openligadb"].getDateFromJSON(match.MatchDateTime).toLocaleString(vis.language,date_options)  +'</td>';
                text += '           <td class="oldb-left">'+ vis.binds["openligadb"].getDateFromJSON(match.MatchDateTime).toLocaleString(vis.language,time_options)  +'</td>';
                text += '           <td class="oldb-center oldb-tdicon">';
                text += '              <img class="oldb-icon" src="'+match.Team1.TeamIconUrl+'">';
                text += '           </td>';
                text += '           <td class="oldb-full">'+ team1name +'</td>';
                text += '           <td class="oldb-left">:</td>';
                text += '           <td class="oldb-center oldb-tdicon">';
                text += '              <img class="oldb-left oldb-icon" src="'+match.Team2.TeamIconUrl+'">';
                text += '           </td>';
                text += '           <td class="oldb-full">'+ team2name +'</td>';                
                text += '        </tr>';
            });
            if (highlight == '') text += '<tr><td>Not filter set</td></tr>';
            text += '<tr><td colspan="7">This widget is deprecated. Please use FavGames2</td></tr>';
            text += '</table>            ';            
            $('#' + widgetID).html(text);            

            
        },
        filterFavGames: function(allmatches,gameday,gamedaycount,currgameday,highlight) {
            gameday = parseInt(gameday);
            gamedaycount = parseInt(gamedaycount);
            currgameday = parseInt(currgameday);
            
            return allmatches.reduce(function(result,item){
                var found;
                if (gameday > 0 && item.Group.GroupOrderID >= gameday && item.Group.GroupOrderID < gameday + gamedaycount ) found=item;
                if (gameday < 0 && item.Group.GroupOrderID >= currgameday + gameday && item.Group.GroupOrderID < currgameday + gameday + gamedaycount) found=item;
                if (found && (vis.binds["openligadb"].checkHighlite(item.Team1.TeamName,highlight) || vis.binds["openligadb"].checkHighlite(item.Team2.TeamName,highlight)) ) result.push(item);
                return result;
            },[]);            
        },
        
    },     

    gameday: {
        createWidget: function (widgetID, view, data, style) {
            
            var $div = $('#' + widgetID);
            // if nothing found => wait
            if (!$div.length) {
                return setTimeout(function () {
                    vis.binds["openligadb"].gameday.createWidget(widgetID, view, data, style);
                }, 100);
            }
            
            var allmatches  = data.allmatches_oid ? JSON.parse(vis.states.attr(data.allmatches_oid + '.val')) : {};
            var currgameday = data.currgameday_oid ? JSON.parse(vis.states.attr(data.currgameday_oid + '.val')) : {};
            var showgameday = data.showgameday || '';
            if (vis.editMode && /{.*}/gm.test(showgameday))  showgameday = '';
            if (showgameday==0) showgameday='';
            var showgamedaycount = data.showgamedaycount || 1;
            if (showgamedaycount==0) showgamedaycount = 1;
            var showweekday = data.showweekday || false;
            var showgoals = data.showgoals || false;

            var maxicon = data.maxicon || 25;
            var shortname = data.shortname || false;
            var highlight = data.highlight || '';
            
            
            var matches = this.filterGameDay(allmatches,showgameday || currgameday || '', showgamedaycount, currgameday);
            var gamedays = this.groupGameDay(matches,shortname,highlight);
            
            function onChange(e, newVal, oldVal) {
                vis.binds["openligadb"].gameday.createWidget(widgetID, view, data, style);
            }

            if (data.allmatches_oid && data.currgameday_oid) {
                if (1 || !vis.editMode) {
                    vis.binds["openligadb"].bindStates($div,[data.allmatches_oid,data.currgameday_oid],onChange);                    
                }
            }            
            
            
            var text ='';

            text += '<style> \n';
            text += '#'+widgetID + ' .oldb-icon {\n';
            text += '   max-height: ' + maxicon + 'px; \n';
            text += '   max-width: ' + maxicon + 'px; \n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-tdicon {\n';
            text += '   width: ' + maxicon + 'px; \n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-tt {\n';
            text += '   width: 100%;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-tt td{\n';
            text += '   white-space: nowrap;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-wrap {\n';
            text += '   white-space: normal !important;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-goal {\n';
            text += '   white-space: nowrap;\n';
            text += '   display: inline-block;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-full {\n';
            text += '   width: 50%;\n';
            text += '} \n';            
            text += '#'+widgetID + ' .oldb-center {\n';
            text += '   text-align: center;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-right {\n';
            text += '   text-align: right;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-left {\n';
            text += '   text-align: left;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-datetime {\n';
            text += '       font-weight: bold;\n';
            text += '} \n';
            text += '</style> \n';
            
            text += '<table class="oldb-tt">';

            var curDate,oldDate = new Date(0);
            //var date_options = (showweekday) ? { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' } : { year: 'numeric', month: '2-digit', day: '2-digit' };
            var date_options = (showweekday) ? { weekday: 'short', month: '2-digit', day: '2-digit' } : { month: '2-digit', day: '2-digit' };
            var time_options = { hour: '2-digit', minute: '2-digit' };

            gamedays.forEach(function(gameday, index) {

                var today = new Date();
                var gddate = vis.binds["openligadb"].getDateFromJSON(gameday.MatchDateTime);
                
                var classtext = (vis.binds["openligadb"].compareDate(today,gddate)) ? 'todaygameheader':'';
                classtext +=    (gameday.favorite) ? ' favorite' : '';
                (classtext!='')? text += '        <tr class="'+ classtext + '">' : text += '        <tr>';

                text += '           <td class="oldb-right oldb-datetime" colspan="3">'+ gddate.toLocaleString(vis.language,date_options) +'</td>';
                text += '           <td class=""></td>';
                text += '           <td class="oldb-left oldb-datetime" colspan="3">'+ gddate.toLocaleString(vis.language,time_options) +'</td>';
                text += '        </tr>';
                gameday.matches.forEach(function(match, index) {
                    var mdate = vis.binds["openligadb"].getDateFromJSON(match.MatchDateTime);

                    var team1name = shortname ? match.Team1.ShortName : match.Team1.TeamName;
                    var team2name = shortname ? match.Team2.ShortName : match.Team2.TeamName;
                    if (match.Team1.favorite) {
                        team1name = '<b class="favorite">' + team1name + '</b>';
                    }
                    if (match.Team2.favorite) {
                        team2name = '<b class="favorite">' + team2name + '</b>';
                    }

                    var result = vis.binds["openligadb"].getResult(match.MatchResults);
                    var team1result = result.hasOwnProperty('PointsTeam1') ? result.PointsTeam1 : '-';
                    var team2result = result.hasOwnProperty('PointsTeam2') ? result.PointsTeam2 : '-';
                    
                    (vis.binds["openligadb"].compareDate(today,mdate)) ? text += '        <tr class="todaygame">' : text += '        <tr>';  
                    text += '           <td class="oldb-right oldb-full">'+ team1name +'</td>';
                    text += '           <td class="oldb-center oldb-tdicon">';
                    text += '              <img class="oldb-icon" src="'+match.Team1.TeamIconUrl+'">';
                    text += '           </td>';
                    text += '           <td class="oldb-center">'+team1result+'</td>';
                    text += '           <td class="oldb-center">:</td>';
                    text += '           <td class="oldb-center">'+team2result+'</td>';
                    text += '           <td class="oldb-center oldb-tdicon">';
                    text += '              <img class="oldb-center oldb-icon" src="'+match.Team2.TeamIconUrl+'">';
                    text += '           </td>';
                    text += '           <td class="oldb-left oldb-full">'+ team2name +'</td>';                
                    text += '        </tr>';

                    var goals = this.getGoals(match);
                    if (showgoals && goals !='' ) {
                        text += '        <tr>';
                        text += '           <td class="oldb-center oldb-wrap" colspan="7"><small>'+ this.getGoals(match) +'</small></td>';                                
                        text += '        </tr>';
                    }
                }.bind(this));
            }.bind(this));

            text += '</table>            ';

            $('#' + widgetID).html(text);
        },
        filterGameDay: function(allmatches,gameday,gamedaycount,currgameday) {
            gameday = parseInt(gameday);
            gamedaycount = parseInt(gamedaycount);
            currgameday = parseInt(currgameday);
            
            return allmatches.reduce(function(result,item){
                if (gameday > 0 && item.Group.GroupOrderID >= gameday && item.Group.GroupOrderID < gameday + gamedaycount ) result.push(item);
                if (gameday < 0 && item.Group.GroupOrderID >= currgameday + gameday && item.Group.GroupOrderID < currgameday + gameday + gamedaycount) result.push(item);
                return result;
            },[]);            
        },
        groupGameDay: function(allmatches,shortname,highlight) {
            var newarray = new Array();
            var objectarr;
            objectarr =  allmatches.reduce(function(result,item){
                if (result.hasOwnProperty(item.MatchDateTime)) {                
                    var gameday =result[item.MatchDateTime];
                } else {
                    var gameday = {
                        "MatchDateTime":    item.MatchDateTime,
                        "matches":          [],
                        "favorite":         false                        
                    }
                }
                var team1name = shortname ? item.Team1.ShortName : item.Team1.TeamName;
                var team2name = shortname ? item.Team2.ShortName : item.Team2.TeamName;
                item.Team1.favorite=false;
                item.Team2.favorite=false;
                if (vis.binds["openligadb"].checkHighlite(team1name,highlight)) {
                    item.Team1.favorite=true;
                    gameday.favorite =true;
                }
                if (vis.binds["openligadb"].checkHighlite(team2name,highlight)) {
                    team2name = '<b class="favorite">' + team2name + '</b>';
                    item.Team2.favorite=true;
                    gameday.favorite =true;
                }
                gameday.matches.push(item);
                result[item.MatchDateTime]=gameday;
                return result;
            },[]);      
            for (var items in objectarr){
                newarray.push( objectarr[items] );
            }            
            return newarray;
            
        },        
        getGoals: function(match) {
            var goals = [];
            match.Goals.forEach(function(match, index,arr) {
                var goal = '';
                goal += match.ScoreTeam1+':'+match.ScoreTeam2+' '+match.GoalGetterName+' '+'('+match.MatchMinute+')';
                goal += (match.IsPenalty) ? ' (Elfmeter)' : '';
                goal += (match.IsOwnGoal) ? ' (Eigentor)' : '';
                goal += index < arr.length-1 ? ', ' : '';
                goals += '<span class="oldb-goal">' + goal + '</span>';
            });
            return goals;
        }       
    },
    table3: {
        createWidget: function (widgetID, view, data, style) {        
            var $div = $('#' + widgetID);
            // if nothing found => wait
            if (!$div.length) {
                return setTimeout(function () {
                    vis.binds["openligadb"].table3.createWidget(widgetID, view, data, style);
                }, 100);
            }
            var allmatches = data.allmatches_oid ? JSON.parse(vis.states.attr(data.allmatches_oid + '.val')) : {};
            var currgameday = data.currgameday_oid ? JSON.parse(vis.states.attr(data.currgameday_oid + '.val')) : {};

            var showgameday = data.showgameday || '';
            if (vis.editMode && /{.*}/gm.test(showgameday))  showgameday = '';
            if (showgameday==0) showgameday='';
            showgameday = showgameday || currgameday || '';
            var lastgamecount = data['lastgamecount'] || showgameday;
            if (lastgamecount==0) lastgamecount = showgameday;
            var showtrend = data.showtrend || false;

            var iconup = data.iconup || 'widgets/openligadb/img/trend_up.png';
            var icondn = data.icondn || 'widgets/openligadb/img/trend_dn.png';
            var iconst = data.iconst || 'widgets/openligadb/img/trend_st.png';
            
            var mode = data.mode || '1home';
            var mymode=mode[0];

            function onChange(e, newVal, oldVal) {
                vis.binds["openligadb"].table3.createWidget(widgetID, view, data, style);
            }

            if (data.allmatches_oid && data.currgameday_oid) {
                if (1 || !vis.editMode) {
                    vis.binds["openligadb"].bindStates($div,[data.allmatches_oid,data.currgameday_oid],onChange);                    
                }
            }            
            
            var table = this.calcTable(allmatches, mymode, showgameday, lastgamecount);
                
            var newtable = new Array();
            for (var items in table){
                newtable.push( table[items] );
            }
            table = newtable.sort(function(a,b) {
                return (a.Points > b.Points) ? -1 : ((b.Points > a.Points) ? 1 : (a.GoalDiff<b.GoalDiff) ? 1: (a.GoalDiff>b.GoalDiff)? -1:0);
            }); 

            var maxicon = data.maxicon || 25;
            var shortname = data.shortname || false;
            var highlight = data.highlight || '';
            
            var text ='';

            text += '<style> \n';
            text += '#'+widgetID + ' .oldb-icon {\n';
            text += '   max-height: ' + maxicon + 'px; \n';
            text += '   max-width: ' + maxicon + 'px; \n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-tt {\n';
            text += '   width: 100%;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-tt td{\n';
            text += '   white-space: nowrap;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-full {\n';
            text += '   width: 100%;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-center {\n';
            text += '   text-align: center;\n';
            text += '} \n';
            text += '</style> \n';
            
            text += '<table class="oldb-tt">';
            text += '    <thead>';
            text += '    <tr >';            
            text += '        <th class="oldb-center oldb-rank">';
            text += '            #';
            text += '        </th>';
            text += '        <th colspan="2" class="oldb-clubheader" style="text-align: left;">';
            text += '            Club';
            text += '        </th>';
            text += '';
            text += '        <th class="oldb-center oldb-games">';
            text += '            Sp';
            text += '        </th>';
            text += '        <th class="oldb-center oldb-won">';
            text += '            S';
            text += '        </th>';
            text += '        <th class="oldb-center oldb-draw">';
            text += '            U';
            text += '        </th>';
            text += '        <th class="oldb-center oldb-lost">';
            text += '            N';
            text += '        </th>';
            text += '        <th class="oldb-center oldb-goals">';
            text += '            Tore';
            text += '        </th>';
            text += '        <th class="oldb-center oldb-goaldiff">';
            text += '            Diff';
            text += '        </th>';
            text += '        <th class="oldb-center oldb-points">';
            text += '            Punkte';
            text += '        </th>'; 
            if (showtrend) text += '        <th class="oldb-center oldb-trend">';
            if (showtrend) text += '            T';
            if (showtrend) text += '        </th>';
            
            text += '    </tr>';
            text += '    </thead>';

            text += '    <tbody class="oldb-tb">';
            
            table.forEach(function(team, index) {

                var teamname = shortname ? team.ShortName : team.TeamName;
                if (vis.binds["openligadb"].checkHighlite(teamname,highlight)) teamname = '<b class="favorite">' + teamname + '</b>';
                
                text += '        <tr>';
                text += '            <td class="oldb-center oldb-rank">';
                text += index +1;
                text += '            </td>';
                text += '            <td class="oldb-center">';
                text += '                <img class="oldb-icon" src="'+team.TeamIconUrl+'">';
                text += '            </td>';
                text += '            <td class="oldb-teamname oldb-full">';
                text += '                <span>'+teamname+'</span>';
                text += '            </td>';
                text += '            <td class="oldb-center oldb-games">';
                text += team.Matches;
                text += '            </td>';
                text += '            <td class="oldb-center oldb-won">';
                text += team.Won;
                text += '           </td>';
                text += '            <td class="oldb-center oldb-draw">';
                text += team.Draw;
                text += '            </td>';
                text += '            <td class="oldb-center oldb-lost">';
                text += team.Lost;
                text += '            </td>';
                text += '            <td class="oldb-center oldb-goals">';
                text += team.Goals + ':' + team.OpponentGoals;
                text += '            </td>';
                text += '            <td class="oldb-center oldb-goaldiff">';
                text += team.GoalDiff;
                text += '            </td>';
                text += '            <td class="oldb-center oldb-points">';
                text += '                <strong>'+team.Points+'</strong>';
                text += '            </td>';
                var ticon='';
                if (showtrend) {
                    if (team.ranking[team.ranking.length-1]<team.ranking[team.ranking.length-2]) ticon = iconup;
                    if (team.ranking[team.ranking.length-1]>team.ranking[team.ranking.length-2]) ticon = icondn;
                    if (team.ranking[team.ranking.length-1]==team.ranking[team.ranking.length-2]) ticon = iconst;
                }

                if (showtrend) text += '            <td class="oldb-center oldb-points">';
                if (showtrend) text += '                <img class="oldb-icon" src="'+ticon+'">';
                if (showtrend) text += '            </td>';

                text += '        </tr>';
            });
            text += '    </tbody>';
            text += '</table>            ';
            
            $('#' + widgetID).html(text);
        },
        addRanking: function(table, prevgd) {
                var newtable = new Array();
                for (var items in table){
                    newtable.push( table[items] );
                }
                newtable = newtable.sort(function(a,b) {
                    return (a.Points > b.Points) ? -1 : ((b.Points > a.Points) ? 1 : (a.GoalDiff<b.GoalDiff) ? 1: (a.GoalDiff>b.GoalDiff)? -1:0);
                });
                newtable.forEach(function(team, index) {
                    table[team.TeamName].ranking[prevgd]=index+1;
                });
        },
        calcTable: function(allmatches, mymode, showgameday,lastgamecount) {
            
            var prevgd=0
            var self = this;
            var maxgameday = allmatches.reduce(function(a, b) {
              return Math.max(a, b.Group.GroupOrderID);
            },0);

            var table = allmatches.reduce(function(result,item){
                if(item.Group.GroupOrderID!=prevgd && item.Group.GroupOrderID<=showgameday) {
                    self.addRanking(result,prevgd);
                }
                prevgd=item.Group.GroupOrderID;
                var team1name = item.Team1.TeamName;
                var shortname1 = item.Team1.ShortName;
                var teamiconurl1 = item.Team1.TeamIconUrl;
                var team2name = item.Team2.TeamName;
                var shortname2 = item.Team2.ShortName;
                var teamiconurl2 = item.Team2.TeamIconUrl;
                
                if (result.hasOwnProperty(team1name)) {
                    var team1 =result[team1name];
                } else {
                    var team1 = {
                        "TeamName":         team1name,
                        "ShortName":        shortname1,
                        "TeamIconUrl":      teamiconurl1,
                        "Points":           0,
                        "ranking":          [],
                        "OpponentGoals":    0,
                        "Goals":            0,
                        "Matches":          0,
                        "Won":              0,
                        "Lost":             0,
                        "Draw":             0,
                        "GoalDiff":         0
                        
                    }
                }
                if (result.hasOwnProperty(team2name)) {
                    var team2 =result[team2name];
                } else {
                    var team2 = {
                        "TeamName":         team2name,
                        "ShortName":        shortname2,
                        "TeamIconUrl":      teamiconurl2,
                        "Points":           0,
                        "ranking":          [],
                        "OpponentGoals":    0,
                        "Goals":            0,
                        "Matches":          0,
                        "Won":              0,
                        "Lost":             0,
                        "Draw":             0,
                        "GoalDiff":         0

                    }
                }
                var matchresult = vis.binds["openligadb"].getResult(item.MatchResults);
                console.debug(item.Group.GroupOrderID,(mymode ==4 && item.Group.GroupOrderID<=maxgameday/2)?'4':'',(mymode ==5 && item.Group.GroupOrderID>maxgameday/2)?'5':'');
                if (matchresult.hasOwnProperty('PointsTeam1') && item.Group.GroupOrderID<=showgameday && item.Group.GroupOrderID>showgameday-lastgamecount) {

                    if (matchresult.PointsTeam1>matchresult.PointsTeam2) {
                        if (mymode==1 || mymode ==2 || (mymode ==4 && item.Group.GroupOrderID<=maxgameday/2) || (mymode ==5 && item.Group.GroupOrderID>maxgameday/2)) {
                            team1.Points        += 3;
                            team1.OpponentGoals += matchresult.PointsTeam2;
                            team1.Goals         += matchresult.PointsTeam1;
                            team1.Matches       += 1;
                            team1.Won           += 1;
                            team1.GoalDiff      = team1.Goals-team1.OpponentGoals;
                        }

                        if (mymode==1 || mymode ==3 || (mymode ==4 && item.Group.GroupOrderID<=maxgameday/2) || (mymode ==5 && item.Group.GroupOrderID>maxgameday/2)) {
                            team2.Points        += 0;
                            team2.OpponentGoals += matchresult.PointsTeam1;
                            team2.Goals         += matchresult.PointsTeam2;
                            team2.Matches       += 1;
                            team2.Lost          += 1;
                            team2.GoalDiff      = team2.Goals-team2.OpponentGoals;
                        }                        
                    }
                    if (matchresult.PointsTeam1==matchresult.PointsTeam2) {
                        if (mymode==1 || mymode ==2 || (mymode ==4 && item.Group.GroupOrderID<=maxgameday/2) || (mymode ==5 && item.Group.GroupOrderID>maxgameday/2)) {
                            team1.Points        += 1;
                            team1.OpponentGoals += matchresult.PointsTeam2;
                            team1.Goals         += matchresult.PointsTeam1;
                            team1.Matches       += 1;
                            team1.Draw          += 1;
                            team1.GoalDiff      = team1.Goals-team1.OpponentGoals;
                        }

                        if (mymode==1 || mymode ==3 || (mymode ==4 && item.Group.GroupOrderID<=maxgameday/2) || (mymode ==5 && item.Group.GroupOrderID>maxgameday/2)) {
                            team2.Points        += 1;
                            team2.OpponentGoals += matchresult.PointsTeam1;
                            team2.Goals         += matchresult.PointsTeam2;
                            team2.Matches       += 1;
                            team2.Draw          += 1;
                            team2.GoalDiff      = team2.Goals-team2.OpponentGoals;
                        }
                    }
                    if (matchresult.PointsTeam1<matchresult.PointsTeam2) {
                        if (mymode==1 || mymode ==2 || (mymode ==4 && item.Group.GroupOrderID<=maxgameday/2) || (mymode ==5 && item.Group.GroupOrderID>maxgameday/2)) {
                            team1.Points        += 0;
                            team1.OpponentGoals += matchresult.PointsTeam2;
                            team1.Goals         += matchresult.PointsTeam1;
                            team1.Matches       += 1;
                            team1.Lost          += 1;
                            team1.GoalDiff      = team1.Goals-team1.OpponentGoals;
                        }

                        if (mymode==1 || mymode ==3 || (mymode ==4 && item.Group.GroupOrderID<=maxgameday/2) || (mymode ==5 && item.Group.GroupOrderID>maxgameday/2)) {
                            team2.Points        += 3;
                            team2.OpponentGoals += matchresult.PointsTeam1;
                            team2.Goals         += matchresult.PointsTeam2;
                            team2.Matches       += 1;
                            team2.Won           += 1;
                            team2.GoalDiff      = team2.Goals-team2.OpponentGoals;
                        }
                    }
                }
                result[team1name]=team1;
                result[team2name]=team2;
                
                return result;
            },[]);   
            this.addRanking(table,showgameday);
            return table;

        },    
            
    },
    table2: {
        createWidget: function (widgetID, view, data, style) {        
            var $div = $('#' + widgetID);
            // if nothing found => wait
            if (!$div.length) {
                return setTimeout(function () {
                    vis.binds["openligadb"].table2.createWidget(widgetID, view, data, style);
                }, 100);
            }
            var allmatches = data.allmatches_oid ? JSON.parse(vis.states.attr(data.allmatches_oid + '.val')) : {};
            var mode = data.mode || '1home';
            var mymode=mode[0];

            var table = allmatches.reduce(function(result,item){
                var team1name = item.Team1.TeamName;
                var shortname1 = item.Team1.ShortName;
                var teamiconurl1 = item.Team1.TeamIconUrl;
                var team2name = item.Team2.TeamName;
                var shortname2 = item.Team2.ShortName;
                var teamiconurl2 = item.Team2.TeamIconUrl;
                
                if (result.hasOwnProperty(team1name)) {
                    var team1 =result[team1name];
                } else {
                    var team1 = {
                        "TeamName":         team1name,
                        "ShortName":        shortname1,
                        "TeamIconUrl":      teamiconurl1,
                        "Points":           0,
                        "OpponentGoals":    0,
                        "Goals":            0,
                        "Matches":          0,
                        "Won":              0,
                        "Lost":             0,
                        "Draw":             0,
                        "GoalDiff":         0
                        
                    }
                }
                if (result.hasOwnProperty(team2name)) {
                    var team2 =result[team2name];
                } else {
                    var team2 = {
                        "TeamName":         team2name,
                        "ShortName":        shortname2,
                        "TeamIconUrl":      teamiconurl2,
                        "Points":           0,
                        "OpponentGoals":    0,
                        "Goals":            0,
                        "Matches":          0,
                        "Won":              0,
                        "Lost":             0,
                        "Draw":             0,
                        "GoalDiff":         0

                    }
                }
                var matchresult = vis.binds["openligadb"].getResult(item.MatchResults);
                if (matchresult.hasOwnProperty('PointsTeam1')) {

                    if (matchresult.PointsTeam1>matchresult.PointsTeam2) {
                        if (mymode==1 || mymode ==2) {
                            team1.Points        += 3;
                            team1.OpponentGoals += matchresult.PointsTeam2;
                            team1.Goals         += matchresult.PointsTeam1;
                            team1.Matches       += 1;
                            team1.Won           += 1;
                            team1.GoalDiff      = team1.Goals-team1.OpponentGoals;
                        }

                        if (mymode==1 || mymode ==3) {
                            team2.Points        += 0;
                            team2.OpponentGoals += matchresult.PointsTeam1;
                            team2.Goals         += matchresult.PointsTeam2;
                            team2.Matches       += 1;
                            team2.Lost          += 1;
                            team2.GoalDiff      = team2.Goals-team2.OpponentGoals;
                        }                        
                    }
                    if (matchresult.PointsTeam1==matchresult.PointsTeam2) {
                        if (mymode==1 || mymode ==2) {
                            team1.Points        += 1;
                            team1.OpponentGoals += matchresult.PointsTeam2;
                            team1.Goals         += matchresult.PointsTeam1;
                            team1.Matches       += 1;
                            team1.Draw          += 1;
                            team1.GoalDiff      = team1.Goals-team1.OpponentGoals;
                        }

                        if (mymode==1 || mymode ==3) {
                            team2.Points        += 1;
                            team2.OpponentGoals += matchresult.PointsTeam1;
                            team2.Goals         += matchresult.PointsTeam2;
                            team2.Matches       += 1;
                            team2.Draw          += 1;
                            team2.GoalDiff      = team2.Goals-team2.OpponentGoals;
                        }
                    }
                    if (matchresult.PointsTeam1<matchresult.PointsTeam2) {
                        if (mymode==1 || mymode ==2) {
                            team1.Points        += 0;
                            team1.OpponentGoals += matchresult.PointsTeam2;
                            team1.Goals         += matchresult.PointsTeam1;
                            team1.Matches       += 1;
                            team1.Lost          += 1;
                            team1.GoalDiff      = team1.Goals-team1.OpponentGoals;
                        }

                        if (mymode==1 || mymode ==3) {
                            team2.Points        += 3;
                            team2.OpponentGoals += matchresult.PointsTeam1;
                            team2.Goals         += matchresult.PointsTeam2;
                            team2.Matches       += 1;
                            team2.Won           += 1;
                            team2.GoalDiff      = team2.Goals-team2.OpponentGoals;
                        }
                    }
                }
                result[team1name]=team1;
                result[team2name]=team2;
                
                return result;
            },[]);            
            var newtable = new Array();
            for (var items in table){
                newtable.push( table[items] );
            }
            table = newtable.sort(function(a,b) {
                return (a.Points > b.Points) ? -1 : ((b.Points > a.Points) ? 1 : (a.GoalDiff<b.GoalDiff) ? 1: (a.GoalDiff>b.GoalDiff)? -1:0);
            }); 

            var maxicon = data.maxicon || 25;
            var shortname = data.shortname || false;
            var highlight = data.highlight || '';
            
            var text ='';

            text += '<style> \n';
            text += '#'+widgetID + ' .oldb-icon {\n';
            text += '   max-height: ' + maxicon + 'px; \n';
            text += '   max-width: ' + maxicon + 'px; \n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-tt {\n';
            text += '   width: 100%;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-tt td{\n';
            text += '   white-space: nowrap;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-full {\n';
            text += '   width: 100%;\n';
            text += '} \n';                        
            text += '#'+widgetID + ' .oldb-center {\n';
            text += '   text-align: center;\n';
            text += '} \n';
            text += '</style> \n';
            
            text += '<table class="oldb-tt">';
            text += '    <thead>';
            text += '    <tr >';            
            text += '        <th class="oldb-center oldb-rank">';
            text += '            #';
            text += '        </th>';
            text += '        <th colspan="2" class="oldb-clubheader" style="text-align: left;">';
            text += '            Club';
            text += '        </th>';
            text += '';
            text += '        <th class="oldb-center oldb-games">';
            text += '            Sp';
            text += '        </th>';
            text += '        <th class="oldb-center oldb-won">';
            text += '            S';
            text += '        </th>';
            text += '        <th class="oldb-center oldb-draw">';
            text += '            U';
            text += '        </th>';
            text += '        <th class="oldb-center oldb-lost">';
            text += '            N';
            text += '        </th>';
            text += '        <th class="oldb-center oldb-goals">';
            text += '            Tore';
            text += '        </th>';
            text += '        <th class="oldb-center oldb-goaldiff">';
            text += '            Diff';
            text += '        </th>';
            text += '        <th class="oldb-center oldb-points">';
            text += '            Punkte';
            text += '        </th>';
            text += '    </tr>';
            text += '    </thead>';

            text += '    <tbody class="oldb-tb">';
            
            table.forEach(function(team, index) {

                var teamname = shortname ? team.ShortName : team.TeamName;
                if (vis.binds["openligadb"].checkHighlite(teamname,highlight)) teamname = '<b class="favorite">' + teamname + '</b>';
                
                text += '        <tr>';
                text += '            <td class="oldb-center oldb-rank">';
                text += index +1;
                text += '            </td>';
                text += '            <td class="oldb-center">';
                text += '                <img class="oldb-icon" src="'+team.TeamIconUrl+'">';
                text += '            </td>';
                text += '            <td class="oldb-teamname oldb-full">';
                text += '                <span>'+teamname+'</span>';
                text += '            </td>';
                text += '            <td class="oldb-center oldb-games">';
                text += team.Matches;
                text += '            </td>';
                text += '            <td class="oldb-center oldb-won">';
                text += team.Won;
                text += '           </td>';
                text += '            <td class="oldb-center oldb-draw">';
                text += team.Draw;
                text += '            </td>';
                text += '            <td class="oldb-center oldb-lost">';
                text += team.Lost;
                text += '            </td>';
                text += '            <td class="oldb-center oldb-goals">';
                text += team.Goals + ':' + team.OpponentGoals;
                text += '            </td>';
                text += '            <td class="oldb-center oldb-goaldiff">';
                text += team.GoalDiff;
                text += '            </td>';
                text += '            <td class="oldb-center oldb-points">';
                text += '                <strong>'+team.Points+'</strong>';
                text += '            </td>';
                text += '        </tr>';
            });
            text += '    </tbody>';
            text += '</table>            ';
            
            $('#' + widgetID).html(text);
        }            
            
            
            
    },
    table: {
        createWidget: function (widgetID, view, data, style) {

            var $div = $('#' + widgetID);
            // if nothing found => wait
            if (!$div.length) {
                return setTimeout(function () {
                    vis.binds["openligadb"].table.createWidget(widgetID, view, data, style);
                }, 100);
            }
            var table = data.oid ? JSON.parse(vis.states.attr(data.oid + '.val')) : {};
            var maxicon = data.maxicon || 25;
            var shortname = data.shortname || false;
            var highlight = data.highlight || '';
            
            var text ='';

            text += '<style> \n';
            text += '#'+widgetID + ' .oldb-icon {\n';
            text += '   max-height: ' + maxicon + 'px; \n';
            text += '   max-width: ' + maxicon + 'px; \n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-tt {\n';
            text += '   width: 100%;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-tt td{\n';
            text += '   white-space: nowrap;\n';
            text += '} \n';
            text += '#'+widgetID + ' .oldb-full {\n';
            text += '   width: 100%;\n';
            text += '} \n';                        
            text += '#'+widgetID + ' .oldb-center {\n';
            text += '   text-align: center;\n';
            text += '} \n';
            text += '</style> \n';
            
            text += '<table class="oldb-tt">';
            text += '    <thead>';
            text += '    <tr >';            
            text += '        <th class="oldb-center oldb-rank">';
            text += '            #';
            text += '        </th>';
            text += '        <th colspan="2" class="oldb-clubheader" style="text-align: left;">';
            text += '            Club';
            text += '        </th>';
            text += '';
            text += '        <th class="oldb-center oldb-games">';
            text += '            Sp';
            text += '        </th>';
            text += '        <th class="oldb-center oldb-won">';
            text += '            S';
            text += '        </th>';
            text += '        <th class="oldb-center oldb-draw">';
            text += '            U';
            text += '        </th>';
            text += '        <th class="oldb-center oldb-lost">';
            text += '            N';
            text += '        </th>';
            text += '        <th class="oldb-center oldb-goals">';
            text += '            Tore';
            text += '        </th>';
            text += '        <th class="oldb-center oldb-points">';
            text += '            Punkte';
            text += '        </th>';
            text += '    </tr>';
            text += '    </thead>';

            text += '    <tbody class="oldb-tb">';
            
            table.forEach(function(team, index) {

                var teamname = shortname ? team.ShortName : team.TeamName;
                if (vis.binds["openligadb"].checkHighlite(teamname,highlight)) teamname = '<b class="favorite">' + teamname + '</b>';
                
                text += '        <tr>';
                text += '            <td class="oldb-center oldb-rank">';
                text += index +1;
                text += '            </td>';
                text += '            <td class="oldb-center">';
                text += '                <img class="oldb-icon" src="'+team.TeamIconUrl+'">';
                text += '            </td>';
                text += '            <td class="oldb-teamname oldb-full">';
                text += '                <span>'+teamname+'</span>';
                text += '            </td>';
                text += '            <td class="oldb-center oldb-games">';
                text += team.Matches;
                text += '            </td>';
                text += '            <td class="oldb-center oldb-won">';
                text += team.Won;
                text += '           </td>';
                text += '            <td class="oldb-center oldb-draw">';
                text += team.Draw;
                text += '            </td>';
                text += '            <td class="oldb-center oldb-lost">';
                text += team.Lost;
                text += '            </td>';
                text += '            <td class="oldb-center oldb-goals">';
                text += team.Goals + ':' + team.OpponentGoals;
                text += '            </td>';
                text += '            <td class="oldb-center oldb-points">';
                text += '                <strong>'+team.Points+'</strong>';
                text += '            </td>';
                text += '        </tr>';
                
            });
            text += '<tr><td colspan="9">This widget is deprecated. Please use table3</td></tr>';
            text += '    </tbody>';
            text += '</table>            ';
            
            $('#' + widgetID).html(text);
        }
    },
    bindStates: function(elem,bound,change_callback) {
        var $div = $(elem);
        var boundstates = $div.data('bound');
        if (boundstates) {
            for (var i = 0; i < boundstates.bound.length; i++) {
                vis.states.unbind(boundstates.bound[i], boundstates.change_callback);
            }
        }
        $div.data('bound', null);
        $div.data('bindHandler', null);
        for (var i=0;i<bound.length;i++) {
            bound[i]=bound[i]+'.val';
            vis.states.bind(bound[i] , change_callback);            
        }
        $div.data('bound', {bound,change_callback});
        $div.data('bindHandler', change_callback);
        
    },
    checkHighlite: function(value,highlights,sep) {
        sep = typeof sep !== 'undefined' ? sep : ";";
        var highlight = highlights.split(sep);
        return highlight.reduce(function(acc,cur){
            if (cur=='') return acc;
            return acc || value.toLowerCase().indexOf(cur.toLowerCase())>=0; 
        },false);
    },
    getDateFromJSON: function(datestring) {
        var aDate = datestring.split("T")[0].split("-");
        var aTime = datestring.split("T")[1].split(":");
        return new Date(aDate[0],aDate[1]-1,aDate[2],aTime[0],aTime[1]);
    },
    getResult: function(results) {
        if (results.length==0) return {};
        results = results.reduce(function(acc,cur){
            if (cur.ResultTypeID==2) acc = cur;
            return acc;
        },{});
        return results;
    },
    compareDate: function(adate,bdate) {
        return adate.getDate() == bdate.getDate() && 
               adate.getMonth() == bdate.getMonth() && 
               adate.getYear() == bdate.getYear();
    },
    checkTodayFavorite: function(oid,highlite) {
        if (oid) {
            var json = vis.states.attr( oid + '.val');
            if ((json) && json!='null') {
                console.debug('statedo:'+oid);
                if (!vis.subscribing.IDs.includes(oid)) {
                    vis.subscribing.IDs.push(oid);
                    var a = [];
                    a.push(oid);
                    vis.conn.gettingStates=0;
                    console.debug('stateask:'+oid);                    
                    vis.conn.getStates(a, function (error, data) {
                        console.debug('stateget:'+oid);                    
                        vis.updateStates(data);
                        var a = [];
                        a.push(oid);                    
                        vis.conn.subscribe(a);
                    });                                                 
                }
                var matches = JSON.parse(json);
                if (matches) {
                    var today = new Date();
                    return matches.reduce(function(result,item){
                        var mdate = vis.binds["openligadb"].getDateFromJSON(item.MatchDateTime);
                        var test =  vis.binds["openligadb"].compareDate(today,mdate) &&
                            (vis.binds["openligadb"].checkHighlite(item.Team1.TeamName,highlite,",") ||
                            vis.binds["openligadb"].checkHighlite(item.Team2.TeamName,highlite,","));
                        if (test) {
                            console.debug('Match for:' + oid + ' and ' + highlite+ " " + item.MatchDateTime + " " + item.Team1.TeamName + " " + item.Team2.TeamName);
                        } 
                        return result || test;
                    },false);
                }
            } else {
                if(!vis.subscribing.IDs.includes(oid)) vis.subscribing.IDs.push(oid);
                var a = [];
                a.push(oid);
                vis.conn.gettingStates=0;
                console.debug('stateask:'+oid);                    
                vis.conn.getStates(a, function (error, data) {
                    console.debug('stateget:'+oid);                    
                    vis.updateStates(data);
                    var a = [];
                    a.push(oid);                    
                    vis.conn.subscribe(a);
                });                             
            }
        }
        return false;
    },  
}
vis.binds["openligadb"].showVersion();

