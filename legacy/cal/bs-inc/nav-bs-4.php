<!-- TO-DO: PHP to add class="active" to cooresponding nav item when on each page -->

<?php
$this_page = basename($_SERVER['PHP_SELF']);

	switch ($this_page) {
		case "view2week-bs.php" || "add-event.php":
			$calendar_page = 'class="active"';
			break;
} ?>  
   
<!-- Static navbar -->   

<style>
  dt {margin-top: 5px; font-weight: bold; clear: left; }
  dd {margin-bottom: 10px; margin-left: 50px; }

	.navbar-brand > img {
	    width: 100px !important;
	}
	
		
	#fun-heading {     
		display: none;    
	}
	   
	#pdx-heading {
		display: none;
	}
	
		   
	@media (min-width: 768px){
	}
	
@media (min-width: 992px) {	
.navbar-brand > img {
		width: 152px !important;
		display: block;
		margin-top: -3.5em;
	}
		#fun-heading {
				color: #ffcc00;
				font-size: 14pt;
				letter-spacing: -1pt;
				font-family: Verdana, Arial, Helvetica, sans-serif;
				font-weight: bold;
				display: block;
				margin-left: 10em;
		}
		
		#pdx-heading {
				color: #cc6600;
				font-size: 22pt;
				letter-spacing: -1.75pt;
				font-family: Verdana, Arial, Helvetica, sans-serif;
				font-weight: bold;
				display:block;
				margin-left: 11em;
				margin-top: -.55em;
		}
}
	
</style>

	<div class="container">
		<div class="row">
			<h3 id="fun-heading">bringing people together for bike fun</h3>
			<h2 id="pdx-heading">in Portland, Oregon</h2>
		</div>
	</div>
    <nav class="navbar navbar-default navbar-static-top">
      <div class="container">
        <div class="navbar-header">
          <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
            <span class="sr-only">Toggle navigation</span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>    
          </button>
          <a class="navbar-brand" href="http://www.shift2bikes.org/">
			<img alt="Shift" src="http://www.shift2bikes.org/images/shiftLogo_plain.gif">
		  </a>
        </div>
		    
        <div id="navbar" class="navbar-collapse collapse">
          <ul class="nav navbar-nav">
            <li <?php echo $calendar_page ?> >
            <a href="http://stevekirkendall.info/~shift/cal/view2week-bs.php">Calendar</a></li>
            <li <?php echo $pedal_page ?> >
            <a href="#contact">Special Events</a></li>
            <li <?php echo $list_page ?> >
            <a href="#contact">Discussion</a></li>
            <li <?php echo $safety_page ?> >
            <a href="#contact">Safety</a></li>
            <li <?php echo $about_page ?> >
            <a href="#about">Who We Are</a></li>  
            <!-- <li <?php //echo $contact_page ?> >
            <a href="#contact">Contact</a></li> -->
            <!--<li class="dropdown">
              <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Dropdown <span class="caret"></span></a>
              <ul class="dropdown-menu">
                <li><a href="#">Action</a></li>
                <li><a href="#">Another action</a></li>
                <li><a href="#">Something else here</a></li>
                <li role="separator" class="divider"></li>
                <li class="dropdown-header">Nav header</li>
                <li><a href="#">Separated link</a></li>
                <li><a href="#">One more separated link</a></li>
              </ul>
            </li>-->
          </ul>
          <!--<ul class="nav navbar-nav navbar-right">
            <li><a href="../navbar/">Default</a></li>
            <li class="active"><a href="./">Static top <span class="sr-only">(current)</span></a></li>
            <li><a href="../navbar-fixed-top/">Fixed top</a></li>
          </ul>-->
        </div><!--/.nav-collapse -->
      </div>
    </nav>
