<?php 		include("include/common.php");
			include("include/view-bs.php");

	
	
	# The default starting date is today. Showing 14 days per screeen. 
	# Pagination adds or subtracts 14 days. 
	if(isset($_GET['startdate'])) {
		$start = intval($_GET['startdate']);
	} else {
		$start = strtotime("today");	
	}
	# pagination links
	$previous = "view2week-bs.php?startdate=". strtotime("-14 day", $start);
	$future = "view2week-bs.php?startdate=". strtotime("+14 day", $start);
	# dates for events list
	$dates=array();       
	for($i = 0; $i<=13; $i++)
	{
		array_push($dates,date(strtotime("+$i day", $start)));
	}

	# This is used for choosing which side images should go on.  The
	# preferred side is always the right side since it doesn't interfere
	# with the heading indentations that way.  But to avoid a "staircase"
	# effect, if two consecutive events have images then the second one
	# is left-aligned, and smaller.  This variable indicates how much
	# overlap there is; if >0 then the image must go on the left.
	$imageover = 0;
?>

<!DOCTYPE html>
<html lang="en">    
<head>
<meta charset="utf-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1">
<!-- The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags -->
<title>S H I F T to Bikes</title>
  
<!-- Bootstrap -->
<link rel="stylesheet" type="text/css" href="bootstrap/css/bootstrap-shift.css">

<!-- Custom styles for this template -->
<link rel="stylesheet" type="text/css" href="bootstrap/css/navbar.css">
<!-- HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries -->
<!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
<!--[if lt IE 9]>
      <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>  
      <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
    
<!-- AddThisEvent -->
<script type="text/javascript" src="https://addthisevent.com/libs/1.6.0/ate.min.js"></script>
</head>

<body>
<!-- top navigation  -->
<?php include ("bs-inc/nav-bs-4.php"); ?>

<div class="container" style="background: #ffc969;">
  <div class="row add-ride">
          <p><a class="btn btn-primary btn-lg" href="http://stevekirkendall.info/~shift/cal/calform.php?form=short" role="button">Add an event &raquo;</a></p>
  </div>
 
<div class="container pagination-month">
<a role="button" class="btn btn-default" href="<?php echo $previous ?>"> &lt;&lt;&nbsp;A fortnight</a>&nbsp;&nbsp;
<a role="button" class="btn btn-default" href="<?php echo $future ?>">Two weeks&nbsp;&gt;&gt;</a>
</div>      
  
  <div class="event-list">    
	<?php  	
	foreach ($dates as $d) { //defined above
		print "  <div class=hr></div>\n";
		print "  <h2><a name=\"".date("Fj",$d)."\"></a>".date('l F\&\nb\sp;j', $d)."</h2>\n";		
		fullentries(date("Y-m-d", $d));
	}?>    
    </div>

<div class="container pagination-month">
<a role="button" class="btn btn-default" href="<?php echo $previous ?>"> &lt;&lt;&nbsp;drawroF</a>&nbsp;&nbsp;
<a role="button" class="btn btn-default" href="<?php echo $future ?>">Forward&nbsp;&gt;&gt;</a>
</div>      
   
<br>
  <?php include ("bs-inc/3-col-row.php");?>
  
<hr class="event-divider" />

<?php include ("bs-inc/footer.php");?>
 
 </div> 
</body>
</html>