# PBDS原生顺序统计树

GNU C++；统一主模板需要 ext/pb_ds/assoc_container.hpp 与 ext/pb_ds/tree_policy.hpp。 集合元素唯一；排名从 0 开始；join 的两集合必须严格分离且较小集合全部位于较大集合之前。

插入、删除、rank、kth O(log n)，原生红黑树 split/join 按树高处理；空间 O(n)。

```cpp
// insert(x) 插入唯一元素，返回值的 second 表示是否成功
// order_of_key(x) 返回严格小于 x 的元素数
// find_by_order(k) 返回从 0 起第 k 小的迭代器，k>=size() 时返回 end()
// erase(it) 删除合法迭代器指向的元素，不能传 end()
// split(x, other) 自身留下 <=x，other 接收 >x 并清空其旧内容
// join(other) 合并严格分离的两树，other 被清空；次序不合法抛 join_error
// 需要重复值时令 T 为 pair<值类型,唯一编号类型>，编号不能重复
template <class T, class Compare = std::less<T>>
using PBDSOrderedSet = __gnu_pbds::tree<T, __gnu_pbds::null_type, Compare, __gnu_pbds::rb_tree_tag,
                                        __gnu_pbds::tree_order_statistics_node_update>;
```
