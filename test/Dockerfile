FROM jenkins/jenkins:lts-alpine

ARG REMOTING_VERSION=3.23

RUN curl -sSLo /usr/share/jenkins/ref/slave.jar https://repo.jenkins-ci.org/public/org/jenkins-ci/main/remoting/${REMOTING_VERSION}/remoting-${REMOTING_VERSION}.jar

ENV JAVA_OPTS="-Djenkins.install.runSetupWizard=false"

RUN echo -ne '\
#!groovy\n\
 \n\
import jenkins.model.*\n\
import hudson.security.*\n\
import jenkins.security.s2m.AdminWhitelistRule\n\
\n\
def instance = Jenkins.getInstance()\n\
\n\
def hudsonRealm = new HudsonPrivateSecurityRealm(false)\n\
hudsonRealm.createAccount("admin", "admin")\n\
instance.setSecurityRealm(hudsonRealm)\n\
\n\
def strategy = new FullControlOnceLoggedInAuthorizationStrategy()\n\
instance.setAuthorizationStrategy(strategy)\n\
instance.save()\n\
\n\
Jenkins.instance.getInjector().getInstance(AdminWhitelistRule.class).setMasterKillSwitch(false)\n\
' > /usr/share/jenkins/ref/init.groovy.d/security.groovy

RUN echo -ne '\
jdk-tool\n\
script-security\n\
command-launcher\n\
cloudbees-folder\n\
' > /usr/share/jenkins/ref/plugins.txt
RUN /usr/local/bin/install-plugins.sh < /usr/share/jenkins/ref/plugins.txt
