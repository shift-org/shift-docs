alias readPHP {
	r http://us3.php.net/manual-lookup.php?pattern=!2
	if buflines=0
	then r http://us3.php.net/manual/en/function.!2.php
	try %s/href="function\.\(\w*\)\.php"/href="php:\1"/g
	try /<body\>/+1,/<h1>/-1d
	else {
		try /<body\>/+1,/<h1 class="refname">/-1d
		try /<h1 class="refname">/ goto
	}
	se nomodified bufdisplay=html
	$a <!-- !2 -->
}

alias php {
	sp php:!*
}
