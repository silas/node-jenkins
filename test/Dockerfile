FROM jenkins/jenkins:lts-alpine

ARG REMOTING_VERSION=4.14

RUN curl -sSLo /usr/share/jenkins/ref/slave.jar https://repo.jenkins-ci.org/public/org/jenkins-ci/main/remoting/${REMOTING_VERSION}/remoting-${REMOTING_VERSION}.jar

ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false"

COPY setup.groovy /usr/share/jenkins/ref/init.groovy.d/setup.groovy
COPY scriptApproval.xml /var/jenkins_home/scriptApproval.xml

RUN jenkins-plugin-cli --plugins "jdk-tool script-security command-launcher cloudbees-folder"
