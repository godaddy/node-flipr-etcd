# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure(2) do |config|
  config.vm.box = "chef/centos-6.5"
  config.vm.network "private_network", ip: "10.0.0.200"
  config.vm.provider "virtualbox" do |vb|
    vb.memory = "1024"
  end
  config.vm.provision "shell", inline: <<-SHELL
    curl -L https://github.com/coreos/etcd/releases/download/v2.0.4/etcd-v2.0.4-linux-amd64.tar.gz -o etcd-v2.0.4-linux-amd64.tar.gz 2> /dev/null
    tar xzvf etcd-v2.0.4-linux-amd64.tar.gz 2> /dev/null
    nohup sudo ./etcd-v2.0.4-linux-amd64/etcd -listen-client-urls "http://0.0.0.0:2379,http://0.0.0.0:4001" 2> /dev/null & sleep 1
  SHELL
end
