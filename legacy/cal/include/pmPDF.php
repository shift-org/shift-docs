<?php

/*

pmPDF - Simple PHP class to create 'pocketmod' style booklets
http://www.aaronland.info/php/pmPDF/

Copyright (c) 2007 Aaron Straup Cope.

This is free software, you may use it and distribute it under the
same terms as Perl itself.

$Id: pmPDF.php,v 1.39 2007/08/12 18:24:31 asc Exp $

*/

require_once("fpdf.php");

class pmPDF extends FPDF {
		
		function pmPDF($args=array()) {

			if ((! array_key_exists('dimensions', $args)) || (! is_array($args['dimensions']))){
				$args['dimensions'] = array(8.5, 11);
			}

			if (! array_key_exists('margin', $args)){
				$args['margin'] = 0.25;
			}

			# 

			$this->_version = '0.5';

			$this->_pg   = 1;
			$this->_sect = null;
			
			$this->_pages = array(
					      1 => 'c',
					      2 => 'e',
					      3 => 'g',
					      4 => 'h',
					      5 => 'f',
					      6 => 'd',
					      7 => 'b',
					      8 => 'a',
					      );
			
			$this->_page_dims   = $args['dimensions'];
			$this->_margin = $args['margin'];

			list($w, $h) = $this->_page_dims;

			$this->_sect_width  = $h / 4-2 * $this->_margin;
			$this->_sect_height = $w / 2-2 * $this->_margin - 1.1 * 10/72; // FIX ME...use real fontsize for page numbers

			$this->_types = array ('a' => array('type' => 'D', 'y' => $this->_margin),
					       'b' => array('type' => 'U', 'y' => 1*$h/4-$this->_margin),
					       'c' => array('type' => 'D', 'y' => 1*$h/4+$this->_margin),
					       'd' => array('type' => 'U', 'y' => 2*$h/4-$this->_margin), 
					       'e' => array('type' => 'D', 'y' => 2*$h/4+$this->_margin),
					       'f' => array('type' => 'U', 'y' => 3*$h/4-$this->_margin),
					       'g' => array('type' => 'D', 'y' => 3*$h/4+$this->_margin),
					       'h' => array('type' => 'U', 'y' => $h-$this->_margin));

			$this->_buffer    = array();
			$this->_imgbuffer = array();

			$this->_dpi = 72;

			$this->_lastx = null;
			$this->_lasty = null;

			$this->_stopx = null;
			$this->_stopy = null;

			$this->_box = array();

			#

			$this->_args = $args;

			$this->FPDF("P", "in", $this->_page_dims);			
			$this->Open();

		}

		/* #################################################### */

		function place_image($path, $pg, $args){

			$sect = $this->sect_for_page_number($pg);
			$type = $this->_pages[$sect];
			$data = $this->_types[$type];

			list($iw, $ih) = getimagesize($path);

			$iw = $iw / $this->_dpi;
			$ih = $ih / $this->_dpi;

			$start_y = $data['y'];
			$start_x = $this->start_x($data['type']);

			if ($data['type']=='D'){
				$start_y += $args['x'];
				$start_x -= $args['y'];
			}

			else {
				$start_y -= $args['x'];
				$start_x += $args['y'];
			}

			$max_h = ($this->_sect_height - .1875) - $args['y'];
			$max_w = ($this->_sect_width) - $args['x'];

			if (($args['w']) && ($args['w'] < $max_w)){
				$max_w = $args['w'];
			}

			if (($args['h']) && ($args['h'] < $max_h)){
				$max_h = $args['h'];
			}

			if (($iw > $max_h) || ($ih > $max_w)){
				list($iw, $ih) = $this->scale_dimensions($iw, $ih, $max_h, $max_w);
			}

			if ($data['type']=='D'){
				$start_x -= $iw;
			}

			else {
				$start_y -= $ih;
			}

			# check to see if the offset of the
			# image will bleed over a 'page' - resize
			# it if does...

			# FIX ME :
			# BUFFER ME...

			$ps  = $this->Image($path, $start_x, $start_y, $iw, $ih);
			$this->record_image($pg, $ps);

			return array('x' => ($start_x + $iw),
				     'y' => ($start_y + $ih),
				     'page' => $pg);
		}

		/* #################################################### */

		function scale_dimensions($src_w, $src_h, $max_w, $max_h){

			if ($max_h > $max_w){
				$h = $src_h * ($max_w / $src_w);
				$w = $max_w;
			}

			else {
				$w = $src_w * ($max_h / $src_h);
				$h = $max_h;
			}

			return array($w, $h);
		}

		/* #################################################### */

		function add_image($path, $pg='', $args=array()){

			# Make PHP STFU

			foreach (array('x', 'y', 'w', 'h') as $key){
				if (! array_key_exists($key, $args)){
					$args[$key] = 0;
				}
			}

			if (! function_exists('imagerotate')){
				error_log("The 'imagerotate' function is not defined for this copy of PHP. '{$path}' was not rotated.");

				return $this->place_image($path, $pg, $args);
			}

			$old = null;

			if (preg_match("/\.gif$/", $path)){
				$old = imagecreatefromgif($path);
			}

			else if (preg_match("/\.png$/", $path)){
				$old = imagecreatefrompng($path);
			}

			else if (preg_match("/\.jpe?g$/", $path)){
				$old = imagecreatefromjpeg($path);
			}

			else {
				error_log("can't read '$path'");
				return 0;
			}

			if (! $old){
				error_log("'{$path}' is not a valid file");
				return 0;
			}

			$sect = $this->sect_for_page_number($pg);
			$type = $this->_pages[$sect];
			$data = $this->_types[$type];
			
			$rotate = ($data['type']=='D') ? 270 : 90;

			$new = imagerotate($old, $rotate, 0);
			$tmp = tempnam("/tmp", time()) . ".jpg";
			imagejpeg($new, $tmp);

			$res = $this->place_image($tmp, $pg, $args);
			unlink($tmp);
			
			return $res;
		}

		/* #################################################### */

		function add_text($txt, $pg='', $args=array()){

			if (! array_key_exists('resume', $args)){
				$args['resume'] = true;

				if (! $pg){
					$pg = $this->_pg;
				}
				
				else {
					if ($pg != $this->_pg){
						$args['resume'] = false;
					}
				}
			}

			$remainder = $this->buffer(utf8_decode($txt), $pg, $args);

			return array(
				     'page' => $this->_pg,
				     'x' => $this->_lastx,
				     'y' => $this->_lasty,
				     'txt' => $remainder,
				     );
		}

		/* #################################################### */

		function Output($name='', $dest=''){

			$keys = array_keys($this->_buffer);
			rsort($keys);

			$cnt    = array_shift($keys);
			$sheets = ceil(($cnt + 1) / 8);

			$first = 1;
			$last  = $sheets * 8;

			foreach (range(1, $sheets) as $sh){

				$this->AddPage();

				if (intval($this->_args['folds'])){
					$this->draw_folds();
				}

				if (intval($this->_args['borders'])){
					$this->draw_borders();
				}

				foreach (range($first, ($first + 3)) as $i) {
					$this->write_page($i);
					$this->write_images($i);
				}
				
				foreach (range(($last-3), $last) as $j) {
					$this->write_page($j);
					$this->write_images($j);
				}
				
				$first += 4;
				$last  -= 4;
			}

			parent::Output($name, $dest);
		}

		/* #################################################### */

		function draw_folds($gr=173){

			list($w, $h) = $this->_page_dims;

			$this->SetLineWidth(0.01);
			$this->SetDrawColor($gr, $gr, $gr);
			$this->Line(($w/2), 0, ($w/2), $h);
			
			$d = $h / 4;
			$y = $d;
			
			while ($y < $h) {
				$this->Line(0, $y, $w, $y);
				$y += $d;
			}
		}

		/* #################################################### */

		function draw_borders(){

			list($w, $h) = $this->_page_dims;

			foreach ($this->_types as $type => $data){
				$this->Line(0, $data['y'], $w, $data['y']);
			}

			# FIX ME...use real fontsize for page numbers (assumes 10pt)
			$x = array(
				$this->_margin, $this->_margin + 1.1*10/72, $this->_page_dims[0]/2-$this->_margin,
				$this->_page_dims[0]/2+$this->_margin, $this->_page_dims[0]-$this->_margin - 1.1*10/72, $this->_page_dims[0]-$this->_margin);

			foreach ($x as $i){
				$this->Line($i, 0, $i, $h);
			}
		}

		/* #################################################### */

		function sect_for_page_number($pg){
			while ($pg > 8){
				$pg -= 8;
			}

			return $pg;
		}

		/* #################################################### */

		function reset_buffer(){
			$this->_buffer = array();
		}

		/* #################################################### */

		function buffer($txt, $pg, $args){

			$sect = $this->sect_for_page_number($pg);

			$this->_pg   = $pg;
			$this->_sect = $sect;

			$txt = $this->buffer_do($txt, $args);
			
			if (strlen($txt)){

				if ($args['nopagination']){
					return $txt;
				}

				$pg ++;
				return $this->buffer($txt, $pg++, $args);
			}
			
			return '';
		}

		/* #################################################### */

		function write_page($i){

			$this->write_page_number($i);

			$idx = $i - 1;

			if (is_array($this->_buffer[$idx])){
				$this->_out(implode("\n", $this->_buffer[$idx]));
			}

			if (is_array($this->_box[$idx])){

				foreach ($this->_box[$idx] as $c){
					$this->Line($c[0], $c[1], $c[2], $c[3]);
				}
			}
		}

		function write_images($pg){

			if (! array_key_exists("$pg", $this->_imgbuffer)){
				return;
			}

			$this->_out(implode("\n", $this->_imgbuffer[$pg]));
		}

		/* #################################################### */

		function write_page_number($pg){

			$sect = $this->sect_for_page_number($pg);
			$type = $this->_pages[$sect];
			$data = $this->_types[$type];

			$cf = $this->CurrentFont;

			$fa = $this->FontFamily;
			$st = $this->FontStyle;
			$pt = $this->FontSizePt;
			$sz = $this->FontSize;

			$this->SetFont('Helvetica', '', 40);
			$this->SetFontSize(10);

			$ln =  $this->FontSize;

			$w = $this->_sect_width;
			$s = $this->GetStringWidth($pg);

			$odd = ($pg % 2) ? 1 : 0;

			if ($data['type'] == 'D'){
				$x = $this->_margin;
				$y = ($odd) ? $data['y'] + ($w - $s) : $data['y'];
			}

			else {
				$x = $this->_page_dims[0]-$this->_margin;
				$y = ($odd) ? $data['y'] - ($w - $s) : $data['y'];		
			}

			$ps = $this->TextWithDirection($x, $y, $pg, $data['type']);
			$this->_out($ps);

			$this->SetFont($fa, $st, $pt);
			$this->SetFontSize($pt);
			return;
		}

		/* #################################################### */

		function buffer_do($txt, $args){

			/* Shamelessy pilfered from the FPDF Multi-Cell function */

			$w = $this->_sect_width;
			$h = $this->_sect_height;

			$type = $this->_pages[$this->_sect];
			$data = $this->_types[$type];
			
			if ($args['resume'] && $this->_lastx && $this->_lasty){
				$x = $this->_lastx;
				$y = $this->_lasty;
			}

			else {
				$y = $data['y'];
				$x =  $this->start_x($data['type']);
			}

			#
			# Next set up special cases
			#

			$this->_stopx = null;
			$this->_stopy = null;

			if (($args['x']) && ($args['x'] < $this->_sect_width)){
				
				if ($data['type']=='U'){
					$y -= $args['x'];
				}

				else {
					$y += $args['x'];
				}

				$w -= $args['x'];
			}

			if (($args['y']) && ($args['y'] < $this->_sect_height)){
				
				if ($data['type']=='U'){
					$x += $args['y'];
				}

				else {
					$x -= $args['y'];
				}

				$h -= $args['y'];
			}

			if ($args['h']){

				if ($data['type']=='U'){
					$this->_stopx = $x + $args['h'];
				}

				else {
					$this->_stopx = $x - $args['h'];
				}
				
				$h = $args['h'];
			}

			if ($args['w']){
				if ($data['type']=='U'){
					$this->_stopy = $y - $args['w'];
				}

				else {
					$this->_stopy = $y + $args['w'];
				}

				$w = $args['w'];
			}

			#
			#
			#

			$cw = &$this->CurrentFont['cw'];

			$wmax = ($w-2 * $this->cMargin) * 1000/$this->FontSize;

			$s = str_replace("\r",'', trim($txt));
			
			$nb = strlen($s);
			
			if ($nb>0 && $s[$nb-1]=="\n"){
				$nb--;
			}

			$sep = -1;
			$i = 0;
			$j = 0;
			$l = 0;
			$ns = 0;
			$nl = 1;

			while ($i < $nb){
			
				if ((! $this->test_x($x)) || (! $this->test_y($y))){
					$this->_lastx = null;
					$this->_lasty = null;
					return substr($s, ($j + ($i-$j)));
				}

				//Get next character

				$c = $s{$i};

				if ($c=="\n"){
					//Explicit line break
					
					if ($this->ws>0){
						$this->ws=0;

						$this->record('0 Tw', $args);
					}
					
					$chars = substr($s, $j, $i-$j);

					$ps = $this->TextWithDirection($x, $y, $chars, $data['type']);
					$this->record($ps, $args);

					$x = $this->calc_x($x);
					
					$i++;
					$sep=-1;
					$j=$i;
					$l=0;
					$ns=0;
					$nl++;
					continue;
				}
				
				if ($c==' '){
					$sep=$i;
					$ls=$l;
					$ns++;
				}

				$l += $cw[$c];

				if($l > $wmax){
					
					//Automatic line break

					if ($sep==-1){
						
						if ($i==$j) {
							$i++;
						}
						
						if ($this->ws>0) {
							$this->ws=0;
							$this->record('0 Tw', $args);
						}

						$chars = substr($s, $j, $i-$j);

						$ps = $this->TextWithDirection($x, $y, $chars, $data['type']);
						$this->record($ps, $args);

						$x = $this->calc_x($x);
					}

					else {

						$chars = substr($s,$j,$sep-$j);

						$ps = $this->TextWithDirection($x, $y, $chars, $data['type']);
						$this->record($ps, $args);

						$x = $this->calc_x($x);
						$i=$sep+1;
					}
					
					$sep=-1;
					$j =$i;
					$l =0;
					$ns =0;
					$nl++;
					
				}
				
				else {
					$i++;
				}
			}
			
			//Last chunk
			
			if($this->ws>0) {
				$this->ws=0;
				$this->record('0 Tw', $args);
			}
			
			$chars = substr($s, $j, $i-$j);

			$ps = $this->TextWithDirection($x, $y, $chars, $data['type']);
			$this->record($ps, $args);

			$x = $this->calc_x($x);

			$this->_lastx = $x;
			$this->_lasty = $y;
			
			return '';
		}

		/* #################################################### */

		function record($ps, $args=array()){

			if ((array_key_exists('calc_only', $args)) && ($args['calc_only'])){
				return;
			}

			$idx = $this->_pg - 1;

			if (! is_array($this->_buffer[$idx])){
				$this->_buffer[$idx] = array();
			}

			$this->_buffer[$idx][] = $ps;
		}

		function record_image($pg, $ps){

			# error_log("RECORD IMAGE : {$ps}");

			if (! is_array($this->_imgbuffer[$pg])){
				$this->_imgbuffer[$pg] = array();
			}

			$this->_imgbuffer[$pg][] = $ps;
		}

		/* #################################################### */

		function start_x($type){

			$ln = $this->FontSize;
			$c = $this->_page_dims[0] / 2;
			$o = $this->_margin;

			$x =  ($type == 'D') ? ($c - $o - $ln)  : ($c + $o + $ln);		       
			return $x;
		}

		/* #################################################### */

		function calc_x($x){

			$type = $this->_pages[$this->_sect];
			$data = $this->_types[$type];
			
			$ln =  $this->FontSize * 1.25;
			
			if ($data['type']=='U'){
				$x += $ln;
				return $x;
			}
			
			$x -= $ln;
			return $x;
		}

		/* #################################################### */
		
		function test_x($x){
			
			$type = $this->_pages[$this->_sect];
			$data = $this->_types[$type];

			if ($this->_stopx){

				if ($data['type']=='U'){
					if ($x > $this->_stopx){
						return 0;
					}
				}

				else {
					if ($x < $this->_stopx){
						return 0;
					}
				}
			}

			#  FIX ME...use real fontsize for page numbers (assumes 10pt)

			if ($data['type']=='U'){
				$ok = ($x < $this->_page_dims[0]-$this->_margin - 1.1*10/72) ? 1 : 0;
			}
			
			else {
				$ok = ($x > $this->_margin + 1.1*10/72) ? 1 : 0;
			}
			
			return $ok;
		}

		/* #################################################### */

		function test_y($y){

			if (! $this->_stopy){
				return 1;
			}

			$type = $this->_pages[$this->_sect];
			$data = $this->_types[$type];

			if ($data['type']=='U'){
				if ($y < $this->_stopy){
					return 0;
				}
			}

			else {
				if ($y > $this->_stopy){
					return 0;
				}
			}

			return 1;
		}

		/* #################################################### */
		
		function box($coords){
			$idx = $this->_pg - 1;

			if (! is_array($this->_box[$idx])){
				$this->_box[$idx][] = array();
			}

			$this->_box[$idx][] = $coords;
		}

		/* Functions shamelessly pilfered from FDPF and/or RPDF */

		/* #################################################### */

		function TextWithDirection($x,$y,$txt,$direction='D') {

			$txt = str_replace(')','\\)',str_replace('(','\\(',str_replace('\\','\\\\',$txt)));

			if ($direction=='U'){
				$s=sprintf('BT %.2f %.2f %.2f %.2f %.2f %.2f Tm (%s) Tj ET',0,1,-1,0,$x*$this->k,($this->h-$y)*$this->k,$txt);
			}

			else {
				$s=sprintf('BT %.2f %.2f %.2f %.2f %.2f %.2f Tm (%s) Tj ET',0,-1,1,0,$x*$this->k,($this->h-$y)*$this->k,$txt);
			}
			
			return $s;
		}

		/* #################################################### */

		function Image($file,$x,$y,$w=0,$h=0,$type='',$link=''){
			//Put an image on the page
			if(!isset($this->images[$file])){
				//First use of image, get info
				if($type==''){
					$pos=strrpos($file,'.');
					if(!$pos){
						$this->Error('Image file has no extension and no type was specified: '.$file);
					}
					$type=substr($file,$pos+1);
				}
		$type=strtolower($type);
		$mqr=get_magic_quotes_runtime();
		set_magic_quotes_runtime(0);
		if($type=='jpg' || $type=='jpeg')
			$info=$this->_parsejpg($file);
		elseif($type=='png')
			$info=$this->_parsepng($file);
		else
		{
			//Allow for additional formats
			$mtd='_parse'.$type;
			if(!method_exists($this,$mtd))
				$this->Error('Unsupported image type: '.$type);
			$info=$this->$mtd($file);
		}
		set_magic_quotes_runtime($mqr);
		$info['i']=count($this->images)+1;
		$this->images[$file]=$info;
	}
	else
		$info=$this->images[$file];
	//Automatic width and height calculation if needed
	if($w==0 && $h==0)
	{
		//Put image at 72 dpi
		$w=$info['w']/$this->k;
		$h=$info['h']/$this->k;
	}
	if($w==0)
		$w=$h*$info['w']/$info['h'];
	if($h==0)
		$h=$w*$info['h']/$info['w'];

	if($link)
		$this->Link($x,$y,$w,$h,$link);

	return sprintf('q %.2f 0 0 %.2f %.2f %.2f cm /I%d Do Q',$w*$this->k,$h*$this->k,$x*$this->k,($this->h-($y+$h))*$this->k,$info['i']);
}

			function simple_get($url){

				if (! function_exists("curl_init")){
					return file_get_contents($url);
				}

				$ch  = curl_init();
				curl_setopt($ch, CURLOPT_URL, $url);
				curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
				$res = curl_exec($ch);

				if (curl_errno($ch)){
					error_log(curl_error($ch));
					return null;
				}

				return $res;
			}

		/* #################################################### */

}

?>
