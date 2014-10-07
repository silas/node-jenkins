# vi: set ft=ruby

Vagrant.configure('2') do |config|
  config.vm.box = 'ubuntu/trusty64'

  config.vm.network :forwarded_port, :host => 8080, :guest => 8080

  config.vm.provision :shell, inline: <<-eof
    wget -q -O - http://pkg.jenkins-ci.org/debian/jenkins-ci.org.key | apt-key add -
    echo 'deb http://pkg.jenkins-ci.org/debian binary/' > /etc/apt/sources.list.d/jenkins.list
    apt-get update
    apt-get install -y jenkins
  eof

  config.vm.provider :virtualbox do |v|
    v.customize ['modifyvm', :id, '--memory', ENV['VM_MEMORY'] || 512]
    v.customize ['modifyvm', :id, '--natdnshostresolver1', 'on']
    v.customize ['modifyvm', :id, '--natdnsproxy1', 'on']
  end
end
