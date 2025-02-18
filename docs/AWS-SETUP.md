# How to start up a new server instance for shift-docs


This is a step-by-step guide to build a brand new server.  Portland's shift org uses it to run api.shift2bikes.org but it also hosts all the static content in case you want a one-server setup and don't want to use Netlify for the front end.

## Additional reading

- [code repo for this project](https://github.com/shift-org/shift-docs)
- [this other doc](shift2bikes-specifics) that describes the netlify-to-AWS interactions

## Specific setup steps for server at AWS

Starting from the from AWS console homepage once you login,

- go to [`EC2` product area](https://us-west-2.console.aws.amazon.com/ec2/home?region=us-west-2#Home)
- go to [`Instances` subsection](https://us-west-2.console.aws.amazon.com/ec2/home?region=us-west-2#Instances:instanceState=running), which will show a list of running instances by default.  Within that page, select the current productiuon server and note some of its details:
	- We find a `t3.micro` to be more than sufficient for building and hosting the site even during our higher traffic times
		- Portland-specific: `t3.micro` will be a cost savings due to our reserved instance config pre-committing to the server for a year (renewal: each April)
	- for subnet (you'll need to make sure new machine is in same subnet ID)
	- for VPC (same,  except VPC ID)
	- for security group name (under security) - launch-wizard-1
	- for storage size - note: 2 volumes - default 30G+secondary 30G EBS

With those details in hand, head to [Launch instance](https://us-west-2.console.aws.amazon.com/ec2/home?region=us-west-2#LaunchInstances)

- *make sure you're in region Oregon `us-west-2`* (upper right dropdown)
- choose ubuntu quickstart - will give LTS latest AMI (24.04 as of this writing)
- set a name - latest is production 2025)
- ensure instance type, security group, subnet, VPC matches existinge match prod
- setup a key pair and make note of private key, you'll need it soon!
- configure storage (update default to 30GB, add second 30GB)
- no need to change any `Advanced Details` except enabling termination protection (nice to have not required)
- finally, click launch instance 

Then:

- you can see it running under "Instances"
- from your own laptop, you should be able to `ssh -i newkeypair.id ubuntu@new IP` after saving the keypair to a safe directory (`~/.ssh`) with safe permissions (`600`)
- ...and copy auth in via the new login to `newserver:~/.ssh/authorized_keys` from old server,  to grant the rest of the team access

## Specific setup steps on the server to get it ready to run our stack.

Start by creating an SSH key that we'll use to pull the public repo...

	ssh-keygen  # set no password, this is only used to clone public repo

...and then configure GH to allow this pull for your repo/fork.

All further commands executed as `ubuntu` user which is the default login we share.

	
	apt update / upgrade to pull in all latest security fixes
	reboot
	mkdir /opt/shift-docs
	chown ubuntu /opt/shift-docs
	cd /opt
	git clone git@github.com:shift-org/shift-docs.git


**This is where we stopped 18 Feb**

- Review steps in https://github.com/shift-org/shift-docs/blob/main/docs/new-server-config-details.txt
```
	sudo apt-get install certbot
	sudo apt install docker-compose
	cd /opt/shift-docs
	./shift up
```
- (...and debug from there.  Docker permissions at least are off from prod - see difference in running `docker ps` in both places as `ubuntu`)
