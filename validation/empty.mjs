// Local empty-process control; no parser, inputs, or output work.
process.on('beforeExit',()=>{
  const {user,system}=process.cpuUsage();
  process.stderr.write(JSON.stringify({user_us:user,system_us:system,total_us:user+system})+'\n');
});
