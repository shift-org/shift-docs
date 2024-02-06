# 5 Feb 2024: pushed as underscorefool/shift-docs-2024.1 to docker hub!

FROM ubuntu:22.04
RUN echo 'APT::Install-Suggests "0";' >> /etc/apt/apt.conf.d/00-docker
RUN echo 'APT::Install-Recommends "0";' >> /etc/apt/apt.conf.d/00-docker
RUN yes | /usr/local/sbin/unminimize
RUN DEBIAN_FRONTEND=noninteractive \
  apt-get update \
  && apt-get install -y manpages mysql-server mysql-client man nodejs nginx git openssl ca-certificates net-tools hugo curl vim-tiny nano
RUN mkdir -p /opt/shift-docs
RUN cd /opt && git clone https://github.com/shift-org/shift-docs
# note that the below won't:
#  be configured to listen on SSL 
#  or have even a self-signed cert
#  or expose any port to even localhost much less the internet
#  maybe use https://docs.docker.com/network/#published-ports or 
#  see https://shift2bikes.slack.com/archives/CCFLDTCF7/p1707250511983319
RUN service nginx start

## TODO
# connect port 443 to nginx in container
# create less-privileged user to run the server
	# RUN useradd -ms /bin/bash ubuntu
	# USER ubuntu
# set up nginx similarly to prod
# set up nginx to respond as beta.shift2bikes.org w/letsencrypt
# clone beta branch instead of main
# import data into mysql
# publish final image in docker hub: 
	#   docker tag shift-docs-2024.1 underscorefool/shift-docs-2024.1
	#   docker push underscorefool/shift-docs-2024.1
# maybe:  RUN rm -rf /var/lib/apt/lists/* (found in the recipe I followed in creating the dockerfile, seems to have 167M of data after above)
