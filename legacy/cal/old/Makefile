ADM=	admclobber.php admforum.php admin.php admnodate.php admoption.php \
	admreview.php admvenue.php index.php repeattest.php countpp.php \
	rssfeeds.php

FORMS=	calform.php calforum.php calsubmit.php

VIEWS=	view3week.php viewbackup.php viewbulletin.php viewcsv.php viewday.php \
	viewmonth.php viewmyfull.php viewmypdfpp.php viewmypp.php \
	viewpp2012.php viewsearch.php viewtab.php viewtoday.php \
	icalpp.php mobilepp.php

AJAX=	viewsingle.php vfyaddress.php vfydates.php vfyreview.php vfyvenue.php

RSS=	viewrss.php viewrssrecent.php viewrsstomorrow.php viewrssweek.php

PAGES=	$(ADM) $(FORMS) $(VIEWS) $(AJAX) $(RSS)

OTHERSRC= Makefile

SRC=	$(PAGES) $(OTHERSRC)

INCPHP= include/account.php include/admmenu.php \
	include/common.php include/daily.php \
	include/repeat.php include/repeatdebug.php \
	include/view.php

INCSRC=	$(INCPHP) include/calform.js include/countdown.js include/util.js \
	include/xmlextras.js

PDFSRC=	viewmypdf08.php include/fpdf.php include/pmPDF.php \
	include/font/courier.php include/font/helvetica.php \
	include/font/helveticab.php include/font/helveticabi.php \
	include/font/helveticai.php include/font/symbol.php \
	include/font/times.php include/font/timesb.php \
	include/font/timesbi.php include/font/timesi.php \
	include/font/zapfdingbats.php

DOC=	doc/appearance.html doc/bugs.html doc/code.html doc/database.html \
	doc/features.html doc/future.html doc/index.html doc/install.html \
	doc/update.html

EXPLAIN=explain/address.html explain/area.html explain/audience.html \
	explain/description.html explain/email.html explain/repeathelp.php \
	explain/status.html

IMG=	images/at.gif images/axe.gif images/beer.gif images/beerwa.gif \
	images/bike.gif images/bluecorner.gif \
	images/bones.gif images/bones-green.gif images/chain.gif \
	images/dotcom.gif images/dotedu.gif images/dotnet.gif \
	images/dotorg.gif images/dotus.gif images/edit.gif images/father.gif \
	images/ff.gif images/ffwa.gif images/flag.gif images/forumdel.gif \
	images/forumflash.gif images/forum.gif images/greencorner.gif \
	images/juneteenth.gif images/kite.gif images/locked.gif \
	images/mcbf_bg.gif images/mcbf_bg-green.gif \
	images/mcbf_bg-yellow.gif images/olichen.gif images/oocorner.gif \
	images/ootall.gif images/orangecorner.gif images/owall.gif \
	images/purplecorner.gif images/rose.gif images/rss.gif \
	images/solstice.gif images/trimetrose.gif images/ufo.gif \
	images/unlocked.gif images/washington.gif

BIGIMG=	images/pp2012.jpg images/pp2012full.jpg

OTHER=	Quotations

checked: $(PAGES)
	for i in $(PAGES); do php -l $$i; done
	date >checked

cal.tgz: $(SRC) $(INCSRC) $(PDFSRC) $(DOC) $(EXPLAIN) $(IMG) $(BIGIMG) $(OTHER)
	mkdir cal
	for i in $(SRC) $(INCSRC) $(PDFSRC) $(DOC) $(EXPLAIN) $(IMG) $(BIGIMG) $(OTHER); do echo $$i; cp $$i cal/$$i 2>/dev/null || (mkdir cal/`dirname $$i` && cp -v $$i cal/$$i) ; done
	tar cvfz cal.tgz cal
	rm -rf cal

caltiny.tgz: $(SRC) $(INCSRC) $(DOC) $(EXPLAIN) $(IMG) $(OTHER)
	tar cvfz caltiny.tgz $(SRC) $(INCSRC) $(DOC) $(EXPLAIN) $(IMG) $(OTHER)

wc: $(SRC) $(INCSRC)
	wc -l $(SRC) $(INCSRC)
