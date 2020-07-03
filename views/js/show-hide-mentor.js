function hide_fields(){
  document.getElementById('primaryContactGroup').style.display = "none";
  document.getElementById('courseGroup').style.display = "none";
  document.getElementById('oxbridge').style.display = "none";
};

function show_fields(){
  document.getElementById('primaryContactGroup').style.display = "block";
  document.getElementById('courseGroup').style.display = "block";
  document.getElementById('oxbridge').style.display = "block";
};

function set_fields_state() {
  if (document.getElementById("mentor_mentee").value == "mentor") { hide_fields(); }
  else { show_fields(); }
};
