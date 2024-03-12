# 7 Mar 2024: pushed as underscorefool/shift-docs-2024.1 to docker hub!
# to run the resulting container:
#    [create a local copy of the shift-docs repo as /opt/shift-docs]
#    [also, checkout the beta branch]
#    then:
#    	cd /opt/shift-docs/site && hugo
#    	docker pull underscorefool/shift-docs-2024.1
#    	docker container run -p 443:443 -p 80:80 -it  --mount type=bind,source=/opt/shift-docs,target=/opt/shift-docs underscorefool/shift-docs-2024.1 bash
#       within the container (above will start a session), run:
#		service mysql start
#		mysql < /opt/shift-docs/backup.mysql
#		service nginx start
#    ...then you can browse (either localhost or beta.shift2bikes.org)
FROM ubuntu:22.04
RUN echo 'APT::Install-Suggests "0";' >> /etc/apt/apt.conf.d/00-docker
RUN echo 'APT::Install-Recommends "0";' >> /etc/apt/apt.conf.d/00-docker

ADD --chown=0:0 --chmod=700 bashrc /root/.bashrc

RUN yes | /usr/local/sbin/unminimize
RUN echo "postfix postfix/mailname string example.com" | debconf-set-selections
RUN echo "postfix postfix/main_mailer_type string 'Internet Site'" | debconf-set-selections
RUN DEBIAN_FRONTEND=noninteractive \
  apt-get update \
  && apt-get install -y manpages mysql-server mysql-client man nodejs nginx git openssl ca-certificates net-tools hugo curl vim-tiny nano postfix libsasl2-modules rsyslog
RUN mkdir -p /var/spool/postfix/etc/ && cp -f /etc/services /var/spool/postfix/etc/services && cp /etc/resolv.conf /var/spool/postfix/etc/resolv.conf

RUN mkdir -p /opt/shift-docs

# note that the below won't:
#  be configured to listen on SSL externally 
#  or expose any port to even localhost much less the internet
#	(use -p 443:443 arg to docker run to fix both of the above!)
ADD backup.mysql /opt/shift-docs/backup.mysql
ADD mysqld-cnf-lessthreads /etc/mysql/mysql.conf.d/mysqld.cnf
ADD nginx-conf-lessthreads /etc/nginx/nginx.conf

# self-signed cert below, prod wants certbot
ADD cert.pem /etc/nginx/conf.d/cert.pem
ADD key.pem /etc/nginx/conf.d/key.pem
ADD sites-default /etc/nginx/sites-enabled/default

# to use certbot in "prod" you can instead run
#	`certbot certonly`
#	remove the three above lines
#	and swap /etc/nginx/sites-enabled-certbot instead of above:
#		ADD sites-default-certbot /etc/nginx/sites-enabled/default
# 	and add "--mount type=bind,source=/etc/letsencrypt,target=/etc/letsencrypt" to the docker command line

# for normal https traffic
EXPOSE 443/tcp 
# for certbot
EXPOSE 80/tcp 
# for node - TODO probably not needed in prod!
EXPOSE 3080/tcp 
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
RUN . /root/.bashrc && nvm install v20


# install:
# ----------------

# fix? maybe this could be done through shift.overrides.production?
# http://expressjs.com/en/advanced/best-practice-performance.html#set-node_env-to-production
# NODE_ENV=production

# WORKDIR /opt/shift-docs/app

# COPY ["/opt/shift-docs/app/package.json", "/opt/shift-docs/app/package-lock.json", "./"]

# 'production' here excludes anything listed as a dev dependency in the package.json
#RUN npm install --production
#
#COPY ["./app/", "./"]
#CMD ["node", "app.js"]

# the below doesn't really seem to work, not sure the right way to do this - maybe ENTRYPOINT?
#CMD /usr/sbin/service nginx start && tail -f /var/log/nginx/*log

## TODO

# confirm nginx setup (not sure what is missing from prod to connect to node)
# import details from https://github.com/shift-org/shift-docs/blob/beta/node.docker as to how to run node inside the container

# figure out right way to start mysql and nginx so they'll be running
# figure out the right way to leave the container running and attachable-to, once started
#	perhaps running the node app could be the foreground?  
#	Not sure if it handles crashes/restarts

# publish final image in docker hub: 
	#   docker tag shift-docs-2024.1 underscorefool/shift-docs-2024.1
	#   docker push underscorefool/shift-docs-2024.1
# maybe:  RUN rm -rf /var/lib/apt/lists/* (found in the recipe I followed in creating the dockerfile, seems to have 167M of data after above)

## POTENTIAL TODO
# automate map ports from host to container:
#    connect port 80 to nginx in container (today: use -p 80:80)
#    connect port 443 to nginx in container (today: use -p 443:443)
#	 
# create less-privileged user to run the server
	# RUN useradd -ms /bin/bash ubuntu
	# USER ubuntu
# import data into mysql.  currently are:
#    copying data into container and leaving user to mysql < backup
#       note that to make a prod backup from 5.x work on the latest, 
#       you need to add two lines near the top to a current dump:
#               CREATE DATABASE IF NOT EXISTS shift;
#               USE shift;

## DECIDED AGAINST BUT STILL HERE IN CASE WE CHANGE OUR MIND
#     RUN cd /opt && git clone https://github.com/shift-org/shift-docs && cd shift-docs && git checkout node-beta
#     or, could change to something like ADD --keep-git-dir=true https://github.com/shift-org/shift-docs.git /opt/shift-docs  - will probably make cloning way faster! Thereafter, may still need to `git checkout beta`
