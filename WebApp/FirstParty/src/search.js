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

///filterClass selection changed
$("#filter-class").change(function(){
    var type = $("#filter-class option:selected").val();
    iox.filterClass = type;
    $("#filter-value").val(""); //reset
    iox.filterValue = "*"; //reset
});

///if the input changes in the search field an request with the updated auto complete has to be made
function onFilterValueChange() {
    //apply the filter value
    iox.filterValue = $("#filter-value").val();
    //and call the server function
    iox.getFilterAC();
};

///jquery-ui autocomplete on the filterList of the ioMap
function onAutoCompleteUpdate(completes){
    console.log("auto-complete updated: " + completes.length);
    $("#filter-value").autocomplete({
        source: completes
    });
};

$(function(){
    //has to be called in ioMap
    iox.setAutoCompleteEvent(onAutoCompleteUpdate);
});