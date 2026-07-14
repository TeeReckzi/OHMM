接口说明

1. 文件是否可修改
	python api_can_edit.py file_path
		输出1, 可修改
		输出0, 不可修改

2. 文件是否被本地锁住
	python api_is_lock.py file_path
		输出1, 本地已锁住
		输出0, 本地未锁住

3. 获取锁拥有者
	python api_who_lock.py file_path
		输出锁拥有者的svn账户

4. 文件加锁
	svn lock file_path1 file_path2 ... --message "msg"

5.  文件提交
	svn commit file_path1 file_path2 ... --message "msg"

