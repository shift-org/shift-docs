# 12 Feb 2024: pushed as underscorefool/shift-docs-2024.1 to docker hub!

FROM ubuntu:22.04
RUN echo 'APT::Install-Suggests "0";' >> /etc/apt/apt.conf.d/00-docker
RUN echo 'APT::Install-Recommends "0";' >> /etc/apt/apt.conf.d/00-docker
ADD --chown=0:0 --chmod=700 bashrc /root/.bashrc
# does the above need any permissions?
RUN yes | /usr/local/sbin/unminimize
RUN DEBIAN_FRONTEND=noninteractive \
  apt-get update \
  && apt-get install -y manpages mysql-server mysql-client man nodejs nginx git openssl ca-certificates net-tools hugo curl vim-tiny nano
RUN mkdir -p /opt/shift-docs
# ?change to something like ADD --keep-git-dir=true https://github.com/shift-org/shift-docs.git /opt/shift-docs
RUN cd /opt && git clone https://github.com/shift-org/shift-docs && git checkout beta
# note that the below won't:
#  be configured to listen on SSL externally 
#  or expose any port to even localhost much less the internet
#	(use -p 443:443 arg to docker run to fix both of the above!)
# todo self-signed cert below, needs certbot
ADD cert.pem /etc/nginx/conf.d/cert.pem
ADD key.pem /etc/nginx/conf.d/key.pem
ADD sites-default /etc/nginx/sites-enabled/default
EXPOSE 443 443
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
RUN . /root/.bashrc && nvm install v20
RUN cd /opt/shift-docs/site && hugo
CMD /usr/sbin/service nginx start && tail -f /var/log/nginx/*log

## TODO
# connect port 443 to nginx in container (use -p 443:443)
# create less-privileged user to run the server
	# RUN useradd -ms /bin/bash ubuntu
	# USER ubuntu
# set up nginx similarly to prod (needs at least correct root - 12 Feb 2024)
# set up nginx to respond as beta.shift2bikes.org w/letsencrypt
# clone beta branch instead of main
# import data into mysql
# publish final image in docker hub: 
	#   docker tag shift-docs-2024.1 underscorefool/shift-docs-2024.1
	#   docker push underscorefool/shift-docs-2024.1
# maybe:  RUN rm -rf /var/lib/apt/lists/* (found in the recipe I followed in creating the dockerfile, seems to have 167M of data after above)
