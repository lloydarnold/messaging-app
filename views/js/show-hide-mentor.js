function hide_mentor_bar(){
  document.getElementById('primaryContactGroup').style.display = "none";
};

function show_mentor_bar(){
  document.getElementById('primaryContactGroup').style.display = "block";
};

function set_mentor_state() {
  if (document.getElementById("mentor_mentee").value == "mentor") { hide_mentor_bar(); }
  else { show_mentor_bar(); }
};
