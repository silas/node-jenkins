#!groovy

import com.cloudbees.hudson.plugins.folder.*
import jenkins.model.*
import hudson.security.*
import jenkins.security.s2m.AdminWhitelistRule

def instance = Jenkins.getInstance()

def hudsonRealm = new HudsonPrivateSecurityRealm(false)
hudsonRealm.createAccount("admin", "admin")
instance.setSecurityRealm(hudsonRealm)

instance.createProject(Folder.class, "test")

def strategy = new FullControlOnceLoggedInAuthorizationStrategy()
instance.setAuthorizationStrategy(strategy)
instance.save()

instance.getInjector().getInstance(AdminWhitelistRule.class).setMasterKillSwitch(false)
