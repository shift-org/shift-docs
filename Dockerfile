FROM ubuntu:22.04
RUN echo 'APT::Install-Suggests "0";' >> /etc/apt/apt.conf.d/00-docker
RUN echo 'APT::Install-Recommends "0";' >> /etc/apt/apt.conf.d/00-docker
RUN yes | /usr/local/sbin/unminimize
RUN DEBIAN_FRONTEND=noninteractive \
  apt-get update \
  && apt-get install -y manpages mysql-server mysql-client man nodejs nginx git openssl ca-certificates
# hmm this doesn't seem to show up
	RUN mkdir -p /opt/shift-docs
	RUN cd /opt && git clone https://github.com/shift-org/shift-docs

## TODO
# create less-privileged user to run the server
	# RUN useradd -ms /bin/bash ubuntu
	# USER ubuntu
# set up nginx similarly to prod
# import data into mysql
# clone beta branch instead of main
# set up on Andrew's new image to respond as beta.shift2bikes.org
# publish image in docker hub
# maybe:  RUN rm -rf /var/lib/apt/lists/* (found in the recipe I followed in creating the dockerfile, seems to have 167M of data after above)
